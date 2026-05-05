const STORAGE_KEY = "mobLnoOpsTool_v2";
const CLOCK_KEY = "mobLnoMissionClock_v1";
const FIREBASE_PATH = "mobDashboard/sharedState";


let state = {
	threats: [],
	spaceRequests: [],
	logs: [],
	maps: {
		geo: "",
		theater: ""
	},
	theaterMarkers: [],

	fos: fosNames.map(name => ({
		name,
		number: name,
		status: "Planning",
		comm: "Unknown",
		jammer: "No",
		note: fosDetails[name]?.focus || ""
	}))
};

function getInputs() {
	const ids = [
		"mobBase", "gameTurn", "phase", "commStatus", "currentLook", "priority", "commanderIntent", "cspocRequest", "mobUpdate", "geoTurnNotes",
		"reportThreat", "reportImpact", "reportRec", "generatedReport"
	];
	const data = {};
	ids.forEach(id => {
		const el = document.getElementById(id);
		if (!el) return;
		data[id] = el.tagName === "DIV" ? el.textContent : el.value;
	});
	document.querySelectorAll(".persist[type='checkbox']").forEach(el => data[el.id] = el.checked);
	return data;
}

function setInputs(data = {}) {
	Object.entries(data).forEach(([id, value]) => {
		const el = document.getElementById(id);
		if (!el) return;
		if (el.type === "checkbox") el.checked = Boolean(value);
		else if (el.tagName === "DIV") el.textContent = value;
		else el.value = value;
	});
}

function saveAll(showAlert = true) {
	state.inputs = getInputs();
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	syncStateToFirebase();
	saveClock();
	if (showAlert) alert("Saved. Your MOB LNO tracker is stored in this browser.");
}

function syncStateToFirebase() {
	if (!window.firebaseDb || !window.firebaseRef || !window.firebaseSet) return;
	const dbRef = window.firebaseRef(window.firebaseDb, FIREBASE_PATH);
	window.firebaseSet(dbRef, {
		...state,
		lastUpdated: Date.now()
	}).catch(err => console.error("Firebase sync failed:", err));
}

function startFirebaseSync() {
	if (!window.firebaseDb || !window.firebaseRef || !window.firebaseOnValue) return;
	const dbRef = window.firebaseRef(window.firebaseDb, FIREBASE_PATH);
	window.firebaseOnValue(dbRef, (snapshot) => {
		const remoteState = snapshot.val();
		if (!remoteState) return;
		state = {
			...state,
			...remoteState
		};
		renderMaps();
		renderFos();
		renderThreats();
		renderSpaceRequests();
		renderLogs();
		setInputs(state.inputs || {});
		updateClockDisplays();
	});
}

function loadAll() {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		try {
			state = JSON.parse(saved);
			if (!state.fos || state.fos.length !== 4) state.fos = fosNames.map(name => ({ name, number: name, status: "Planning", comm: "Unknown", jammer: "No", note: fosDetails[name]?.focus || "" }));
			if (!state.maps) state.maps = { geo: "", theater: "" };
			if (!state.theaterMarkers) state.theaterMarkers = [];
		} catch {
			console.warn("Saved data could not be loaded.");
		}
	}
	renderMaps();
	renderFos();
	renderThreats();
	renderSpaceRequests();
	renderLogs();
	setInputs(state.inputs || {});
	// Set default for geoTurnNotes if empty
	const geoTurnNotesEl = document.getElementById("geoTurnNotes");
	if (geoTurnNotesEl && !geoTurnNotesEl.value.trim()) {
		geoTurnNotesEl.value = defaultGeoTurnTemplate;
	}
	loadClock();
	startClockLoop();
	updateClockDisplays();
	startFirebaseSync();
}

function val(id) { return document.getElementById(id).value.trim(); }

function optionSet(options, selected) {
	return options.map(opt => `<option value="${escapeHtml(opt)}" ${opt === selected ? "selected" : ""}>${escapeHtml(opt)}</option>`).join("");
}

function escapeHtml(str = "") {
	return String(str)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function resetAll() {
	if (!confirm("Reset all MOB LNO tracker data?")) return;
	localStorage.removeItem(STORAGE_KEY);
	localStorage.removeItem(CLOCK_KEY);
	location.reload();
}