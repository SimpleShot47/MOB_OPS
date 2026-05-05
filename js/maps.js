const correctFosMarkers = [
	{ label: "Kadena AB | Hex 407", status: "Planning", note: "Forward Japan/Okinawa MOB/FOS", x: 55.6, y: 37.1 },
	{ label: "Yokota AB | Hex 209", status: "Planning", note: "Japan mobility/C2 support hub", x: 60.3, y: 27.4 },
	{ label: "Andersen AFB | Hex 609", status: "Planning", note: "Guam MOB/FOS sustainment hub", x: 75.0, y: 45.4 },
	{ label: "Osan AB | Hex 107", status: "Planning", note: "Korea MOB/FOS", x: 57.9, y: 21.5 }
];

const geoZoneDetails = {
	"GEO 1": "Western Pacific / East Asia | Primary Pacific Shield operational zone | Kadena, Yokota, Osan, Andersen support | Highest ISR, COMM, GPS, and threat priority.",
	"GEO 2": "Southeast Asia / Indian Ocean | Mobility, sustainment, logistics, and alternate route support zone.",
	"GEO 3": "Central CSpOC orbital bridge | Core ISR, SDA, missile warning, and global space coordination zone.",
	"GEO 4": "Atlantic / Americas sustainment bridge | CONUS reinforcement and orbital transition zone.",
	"GEO 5": "Pacific continuity / western return path | Reinforcement timing, Pacific orbital awareness, and strategic continuity zone."
};

const defaultGeoTurnTemplate = `Turn 1:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 2:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 3:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 4:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 5:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 6:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 7:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:

Turn 8:
- GEO focus:
- Key satellites:
- ISR/SDA findings:
- Threats/jammers:
- COMM/GPS opportunities:
- MOB impact:
- Recommended action:`;

function handleMapUpload(event, type) {
	const file = event.target.files?.[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = () => {
		state.maps[type] = reader.result;
		renderMaps();
		saveAll(false);
	};
	reader.readAsDataURL(file);
}

function renderMaps() {
	const geoPreview = document.getElementById("geoMapPreview");
	const theaterPreview = document.getElementById("theaterMapPreview");

	if (geoPreview) {
		geoPreview.innerHTML = state.maps?.geo
			? `<img src="${state.maps.geo}" alt="Strategic GEO and CSpOC map" />`
			: `<span>Upload GEO Zone / CSpOC map image</span>`;
	}

	if (theaterPreview) {
		theaterPreview.innerHTML = state.maps?.theater
			? `<img src="${state.maps.theater}" alt="Theater and main game board map" />`
			: `<span>Upload theater / main game board image</span>`;
		renderTheaterMarkers();
	}

	renderMarkerTable();
}

function openMapModal(type) {
	const imageData = state.maps?.[type];
	if (!imageData) {
		alert("Upload this map first.");
		return;
	}

	const modal = document.getElementById("mapModal");
	const modalImage = document.getElementById("mapModalImage");
	const modalTitle = document.getElementById("mapModalTitle");
	if (!modal || !modalImage || !modalTitle) return;

	modalTitle.textContent = type === "geo" ? "Strategic GEO / CSpOC Map" : "Theater / Main Game Board";
	modalImage.src = imageData;
	modal.classList.add("active");
	renderModalMarkers(type);
}

function closeMapModal(event) {
	if (event) event.stopPropagation();
	const modal = document.getElementById("mapModal");
	if (modal) modal.classList.remove("active");
}

function clearMap(type) {
	if (!confirm("Clear this uploaded map?")) return;
	state.maps[type] = "";
	renderMaps();
	saveAll(false);
}

function setMapNote(note) {
	const noteBox = document.getElementById("mapNoteBox");
	if (noteBox) noteBox.textContent = note;
}

function getMarkerClass(status) {
	if (status === "Operational") return "marker-operational";
	if (status === "Building") return "marker-building";
	if (status === "At Risk") return "marker-risk";
	if (status === "Abandoning") return "marker-abandoning";
	return "marker-planning";
}

function getMarkerShortLabel(label) {
	if (label.includes("Kadena")) return "KAD";
	if (label.includes("Yokota")) return "YOK";
	if (label.includes("Andersen")) return "AND";
	if (label.includes("Osan")) return "OSN";
	return label.replace("FOS ", "F").slice(0, 4);
}

function handleTheaterMapClick(event) {
	if (!state.maps?.theater) {
		alert("Upload the theater map first.");
		return;
	}

	if (event.target.classList.contains("map-marker")) return;

	const preview = document.getElementById("theaterMapPreview");
	const rect = preview.getBoundingClientRect();
	const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
	const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
	const label = document.getElementById("markerLabel").value;
	const status = document.getElementById("markerStatus").value;
	const note = document.getElementById("markerNote").value.trim();

	const existingIndex = state.theaterMarkers.findIndex(marker => marker.label === label);
	const marker = {
		label,
		status,
		note,
		x: Number(xPercent.toFixed(2)),
		y: Number(yPercent.toFixed(2))
	};

	if (existingIndex >= 0) state.theaterMarkers[existingIndex] = marker;
	else state.theaterMarkers.push(marker);

	renderTheaterMarkers();
	renderMarkerTable();
	saveAll(false);
}

function renderTheaterMarkers() {
	const preview = document.getElementById("theaterMapPreview");
	if (!preview || !state.theaterMarkers) return;
	preview.querySelectorAll(".map-marker").forEach(marker => marker.remove());

	state.theaterMarkers.forEach(marker => {
		const markerEl = document.createElement("div");
		markerEl.className = `map-marker ${getMarkerClass(marker.status)}`;
		markerEl.style.left = `${marker.x}%`;
		markerEl.style.top = `${marker.y}%`;
		markerEl.title = `${marker.label} | ${marker.status}${marker.note ? " | " + marker.note : ""}`;
		markerEl.innerHTML = `<span>${getMarkerShortLabel(marker.label)}</span>`;
		markerEl.onclick = event => {
			event.stopPropagation();
			document.getElementById("markerLabel").value = marker.label;
			document.getElementById("markerStatus").value = marker.status;
			document.getElementById("markerNote").value = marker.note || "";
			setMapNote(`${marker.label}: ${marker.status}${marker.note ? " - " + marker.note : ""}`);
		};
		preview.appendChild(markerEl);
	});
}

function renderModalMarkers(type) {
	const wrap = document.getElementById("modalMapWrap");
	if (!wrap) return;
	wrap.querySelectorAll(".map-marker").forEach(marker => marker.remove());
	if (type !== "theater") return;

	state.theaterMarkers.forEach(marker => {
		const markerEl = document.createElement("div");
		markerEl.className = `map-marker ${getMarkerClass(marker.status)}`;
		markerEl.style.left = `${marker.x}%`;
		markerEl.style.top = `${marker.y}%`;
		markerEl.title = `${marker.label} | ${marker.status}${marker.note ? " | " + marker.note : ""}`;
		markerEl.innerHTML = `<span>${getMarkerShortLabel(marker.label)}</span>`;
		wrap.appendChild(markerEl);
	});
}

function renderMarkerTable() {
	const tbody = document.getElementById("markerTable");
	if (!tbody) return;

	tbody.innerHTML = state.theaterMarkers.map((marker, index) => `
    <tr>
      <td>${escapeHtml(marker.label)}</td>
      <td>${escapeHtml(marker.status)}</td>
      <td>${escapeHtml(marker.note || "")}</td>
      <td>${marker.x.toFixed(1)}%, ${marker.y.toFixed(1)}%</td>
      <td><button class="red" onclick="deleteTheaterMarker(${index})">Delete</button></td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="muted">No FOS markers placed yet.</td></tr>`;
}

function deleteTheaterMarker(index) {
	state.theaterMarkers.splice(index, 1);
	renderTheaterMarkers();
	renderMarkerTable();
	saveAll(false);
}

function clearTheaterMarkers() {
	if (!confirm("Clear all FOS markers from the theater map?")) return;
	state.theaterMarkers = [];
	renderTheaterMarkers();
	renderMarkerTable();
	saveAll(false);
}

function loadCorrectFosMarkers() {
	if (!state.maps?.theater) {
		alert("Upload the theater map first, then load the correct FOS markers.");
		return;
	}

	const confirmLoad = confirm("Load the four board-based MOB/FOS markers: Kadena AB Hex 407, Yokota AB Hex 209, Andersen AFB Hex 609, and Osan AB Hex 107? Existing markers will be replaced.");
	if (!confirmLoad) return;

	state.theaterMarkers = correctFosMarkers.map(marker => ({ ...marker }));
	renderTheaterMarkers();
	renderMarkerTable();
	saveAll(false);
	setMapNote("Loaded correct MOB/FOS markers from the board: Kadena 407, Yokota 209, Andersen 609, and Osan 107. Adjust manually if your uploaded image alignment differs.");
}