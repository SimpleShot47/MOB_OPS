

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
		missionClock = {
			startTimestamp: parsedClock.startTimestamp || null,
			accumulatedMs: parsedClock.accumulatedMs || 0,
			running: parsedClock.running || false
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
	if (!missionClock.running) return missionClock.accumulatedMs;
	return missionClock.accumulatedMs + (Date.now() - missionClock.startTimestamp);
}

function getCurrentSegment(elapsedMinutes) {
	return missionSegments.find(segment => elapsedMinutes >= segment.start && elapsedMinutes < segment.end) || missionSegments[missionSegments.length - 1];
}

function formatDuration(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
	const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
	const seconds = String(totalSeconds % 60).padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
}

function formatMissionClockMinutes(minutes) {
	const safeMinutes = Math.max(0, Math.floor(minutes));
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

	const localTimeEl = document.getElementById("localTimeDisplay");
	const zuluTimeEl = document.getElementById("zuluTimeDisplay");
	const dcTimeEl = document.getElementById("dcTimeDisplay");
	const jpnTimeEl = document.getElementById("jpnTimeDisplay");
	const guamTimeEl = document.getElementById("guamTimeDisplay");
	const hickamTimeEl = document.getElementById("hickamTimeDisplay");
	const elapsedEl = document.getElementById("missionElapsedDisplay");
	const segmentEl = document.getElementById("segmentDisplay");

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
	const panel = document.getElementById("primaryReminder");
	if (!panel) return;

	const dotClass = segment.hot ? "hot" : segment.warn ? "warn" : "";
	const timeWarning = minutesRemaining <= 2 && missionClock.running
		? `<div class="reminder-item"><span class="reminder-dot hot"></span><span><strong>${minutesRemaining} minute(s) remaining in ${escapeHtml(segment.name)}.</strong> Prepare transition or final update now.</span></div>`
		: "";

	panel.innerHTML = `
    <div class="reminder-item">
      <span class="reminder-dot ${dotClass}"></span>
      <span><strong>${escapeHtml(segment.name)}:</strong> ${escapeHtml(segment.reminder)}</span>
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
	const currentLook = document.getElementById("currentLook");
	if (!currentLook) return;
	currentLook.value = segment.name;
	saveAll(false);
	updateClockDisplays();
}

function setMissionElapsedFromSlider(minutes) {
	const clampedMinutes = Math.max(0, Math.min(140, Number(minutes)));
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
	const slider = document.getElementById("missionTimeSlider");
	const blockName = document.getElementById("missionTimeBlockName");
	const blockWindow = document.getElementById("missionTimeBlockWindow");
	const labels = document.getElementById("missionTimeLabels");

	const clampedMinutes = Math.max(0, Math.min(140, Math.floor(elapsedMinutes)));
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
			return `<button type="button" class="time-chip ${isActive} ${isExecution}" onclick="setMissionElapsedFromSlider(${item.start})">${shortName}</button>`;
		}).join("");
	}
}