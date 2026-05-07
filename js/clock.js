
const MISSION_TOTAL_MINUTES = 140;

function getClockEl(id) {
	return document.getElementById(id);
}

function clampMissionMinutes(minutes) {
	const numericMinutes = Number(minutes);
	if (Number.isNaN(numericMinutes)) return 0;
	return Math.max(0, Math.min(MISSION_TOTAL_MINUTES, numericMinutes));
}

function safeEscape(str = "") {
	if (typeof escapeHtml === "function") return escapeHtml(str);
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}


const missionSegments = [
	{
		name: "Mission Planning",
		start: 0,
		end: 30,
		reminder: "Mission Planning: CAOC, MOBs, and CSpOC conduct joint planning. Review orders, political constraints, RFIs, aircraft apportionment, and space support requests."
	},
	{
		name: "Mission Pre-Brief",
		start: 30,
		end: 45,
		warn: true,
		reminder: "Mission Pre-Brief: Mission Commanders brief their team and instructor. Finalize RFIs, execution priorities, and commander guidance."
	},
	{
		name: "Turn 1 Execution",
		start: 45,
		end: 70,
		hot: true,
		reminder: "TURN 1 EXECUTION: MOBs report final ATOs, fighter munitions, risk tokens, threats, and execution decisions to CAOC."
	},
	{
		name: "Turn 2 Planning",
		start: 70,
		end: 95,
		reminder: "Turn 2 Planning: Reassess threats, FOS posture, aircraft availability, RFIs, political constraints, and CSpOC support needs."
	},
	{
		name: "Turn 2 Execution",
		start: 95,
		end: 120,
		hot: true,
		reminder: "TURN 2 EXECUTION: Execute second-turn ATOs, confirm risk tokens, space effects, munitions, and final MOB-to-CAOC reporting."
	},
	{
		name: "Hotwash / Debrief",
		start: 120,
		end: 140,
		reminder: "Hotwash/Debrief: Capture instructor feedback, decisions made, mission effects, gaps, and lessons learned."
	}
];

let missionClock = {
	startTimestamp: null,
	accumulatedMs: 0,
	running: false
};

let clockInterval = null;

function startMissionClock() {
	if (!missionClock.running) {
		missionClock.startTimestamp = Date.now();
		missionClock.running = true;
		saveClock();
		startClockLoop();
		updateClockDisplays();
	}
}

function pauseMissionClock() {
	if (!missionClock.running) return;
	missionClock.accumulatedMs += Date.now() - missionClock.startTimestamp;
	missionClock.startTimestamp = null;
	missionClock.running = false;
	saveClock();
	updateClockDisplays();
}

function resetMissionClock() {
	if (!confirm("Reset the mission clock only?")) return;
	missionClock = { startTimestamp: null, accumulatedMs: 0, running: false };
	saveClock();
	updateClockDisplays();
}

function saveClock() {
	if (typeof CLOCK_KEY === "undefined") return;
	localStorage.setItem(CLOCK_KEY, JSON.stringify(missionClock));
}

function loadClock() {
	if (typeof CLOCK_KEY === "undefined") return;
	const savedClock = localStorage.getItem(CLOCK_KEY);
	if (!savedClock) return;

	try {
		const parsedClock = JSON.parse(savedClock);
		const accumulatedMs = Number(parsedClock.accumulatedMs) || 0;
		missionClock = {
			startTimestamp: parsedClock.startTimestamp || null,
			accumulatedMs: Math.max(0, Math.min(accumulatedMs, MISSION_TOTAL_MINUTES * 60000)),
			running: Boolean(parsedClock.running)
		};
	} catch {
		missionClock = { startTimestamp: null, accumulatedMs: 0, running: false };
	}
}

function startClockLoop() {
	if (clockInterval) clearInterval(clockInterval);
	clockInterval = setInterval(updateClockDisplays, 1000);
}

function getElapsedMs() {
	const baseMs = Number(missionClock.accumulatedMs) || 0;
	const runningMs = missionClock.running && missionClock.startTimestamp ? Date.now() - missionClock.startTimestamp : 0;
	return Math.max(0, Math.min(baseMs + runningMs, MISSION_TOTAL_MINUTES * 60000));
}

function getCurrentSegment(elapsedMinutes) {
	const clampedMinutes = clampMissionMinutes(elapsedMinutes);
	return missionSegments.find(segment => clampedMinutes >= segment.start && clampedMinutes < segment.end) || missionSegments[missionSegments.length - 1];
}

function formatDuration(ms) {
	const safeMs = Math.max(0, Number(ms) || 0);
	const totalSeconds = Math.floor(safeMs / 1000);
	const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
	const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
	const seconds = String(totalSeconds % 60).padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
}

function formatMissionClockMinutes(minutes) {
	const safeMinutes = Math.max(0, Math.floor(Number(minutes) || 0));
	const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
	const mins = String(safeMinutes % 60).padStart(2, "0");
	return `${hours}:${mins}`;
}

function updateClockDisplays() {
	const now = new Date();
	const elapsedMs = getElapsedMs();
	const elapsedMinutes = elapsedMs / 60000;
	const segment = getCurrentSegment(elapsedMinutes);
	const minutesIntoSegment = Math.max(0, Math.floor(elapsedMinutes - segment.start));
	const minutesRemaining = Math.max(0, Math.ceil(segment.end - elapsedMinutes));
	const localTimeEl = getClockEl("localTimeDisplay");
	const zuluTimeEl = getClockEl("zuluTimeDisplay");
	const dcTimeEl = getClockEl("dcTimeDisplay");
	const jpnTimeEl = getClockEl("jpnTimeDisplay");
	const guamTimeEl = getClockEl("guamTimeDisplay");
	const hickamTimeEl = getClockEl("hickamTimeDisplay");
	const elapsedEl = getClockEl("missionElapsedDisplay");
	const segmentEl = getClockEl("segmentDisplay");

	const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };

	if (localTimeEl) localTimeEl.textContent = now.toLocaleTimeString([], timeOptions);
	if (zuluTimeEl) zuluTimeEl.textContent = now.toLocaleTimeString("en-GB", { ...timeOptions, timeZone: "UTC" });
	if (dcTimeEl) dcTimeEl.textContent = now.toLocaleTimeString("en-US", { ...timeOptions, timeZone: "America/New_York" });
	if (jpnTimeEl) jpnTimeEl.textContent = now.toLocaleTimeString("en-US", { ...timeOptions, timeZone: "Asia/Tokyo" });
	if (guamTimeEl) guamTimeEl.textContent = now.toLocaleTimeString("en-US", { ...timeOptions, timeZone: "Pacific/Guam" });
	if (hickamTimeEl) hickamTimeEl.textContent = now.toLocaleTimeString("en-US", { ...timeOptions, timeZone: "Pacific/Honolulu" });
	if (elapsedEl) elapsedEl.textContent = formatDuration(elapsedMs);
	if (segmentEl) segmentEl.textContent = segment.name;

	updateReminderPanel(segment, minutesIntoSegment, minutesRemaining);
	updateMissionTimeSlider(elapsedMinutes, segment);
}

function updateReminderPanel(segment, minutesIntoSegment, minutesRemaining) {
	const panel = getClockEl("primaryReminder");
	if (!panel) return;

	const dotClass = segment.hot ? "hot" : segment.warn ? "warn" : "";
	const timeWarning = minutesRemaining <= 2 && missionClock.running
		? `<div class="reminder-item"><span class="reminder-dot hot"></span><span><strong>${minutesRemaining} minute(s) remaining in ${safeEscape(segment.name)}.</strong> Prepare transition or final update now.</span></div>`
		: "";

	panel.innerHTML = `
    <div class="reminder-item">
      <span class="reminder-dot ${dotClass}"></span>
      <span><strong>${safeEscape(segment.name)}:</strong> ${safeEscape(segment.reminder)}</span>
    </div>
    <div class="reminder-item">
      <span class="reminder-dot warn"></span>
      <span>Segment time: ${minutesIntoSegment} minute(s) in / ${minutesRemaining} minute(s) remaining.</span>
    </div>
    ${timeWarning}
  `;
}

function markCurrentLook() {
	const elapsedMinutes = getElapsedMs() / 60000;
	const segment = getCurrentSegment(elapsedMinutes);
	const currentLook = getClockEl("currentLook");
	if (!currentLook) return;
	currentLook.value = segment.name;
	if (typeof saveAll === "function") saveAll(false);
	updateClockDisplays();
}

function setMissionElapsedFromSlider(minutes) {
	const clampedMinutes = clampMissionMinutes(minutes);
	missionClock.accumulatedMs = clampedMinutes * 60000;
	missionClock.startTimestamp = missionClock.running ? Date.now() : null;
	saveClock();
	markCurrentLook();
	updateClockDisplays();
}

function snapToCurrentBlockStart() {
	const elapsedMinutes = getElapsedMs() / 60000;
	const segment = getCurrentSegment(elapsedMinutes);
	setMissionElapsedFromSlider(segment.start);
}

function updateMissionTimeSlider(elapsedMinutes, segment) {
	const slider = getClockEl("missionTimeSlider");
	const blockName = getClockEl("missionTimeBlockName");
	const blockWindow = getClockEl("missionTimeBlockWindow");
	const labels = getClockEl("missionTimeLabels");

	const clampedMinutes = Math.floor(clampMissionMinutes(elapsedMinutes));
	if (slider) slider.value = clampedMinutes;
	if (blockName) blockName.textContent = segment.name;
	if (blockWindow) blockWindow.textContent = `${formatMissionClockMinutes(segment.start)}-${formatMissionClockMinutes(segment.end)} | T+${formatMissionClockMinutes(clampedMinutes)}`;

	if (labels) {
		labels.innerHTML = missionSegments.map(item => {
			const isActive = clampedMinutes >= item.start && clampedMinutes < item.end ? "active" : "";
			const isExecution = item.hot ? "execution" : "";
			const shortName = item.name
				.replace("Mission ", "")
				.replace("Turn ", "T")
				.replace("Hotwash / Debrief", "Debrief");
			return `<button type="button" class="time-chip ${isActive} ${isExecution}" onclick="setMissionElapsedFromSlider(${item.start})">${safeEscape(shortName)}</button>`;
		}).join("");
	}
}