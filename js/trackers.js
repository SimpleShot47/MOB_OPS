function clearChecklist() {
	document.querySelectorAll(".persist[type='checkbox']").forEach(el => el.checked = false);
	saveAll(false);
}

function renderFos() {
	const grid = document.getElementById("fosGrid");
	grid.innerHTML = "";
	state.fos.forEach((fos, index) => {
		const statusClass = fos.status === "Operational" ? "pill-green" : fos.status === "At Risk" ? "pill-red" : fos.status
			=== "Building" ? "pill-amber" : "pill-blue";
		const details = fosDetails[fos.name] || {
			role: "MOB/FOS", focus: "Track mission support requirements.", watch:
				"Monitor threats, COMM, GPS, weather, and sustainment."
		};
		const div = document.createElement("div");
		div.className = "fos-card";
		div.innerHTML = `
  <h3>${fos.name} <span class="status-pill ${statusClass}">${fos.status}</span></h3>
  <p class="small"><strong>Role:</strong> ${escapeHtml(details.role)}</p>
  <p class="small"><strong>Primary Focus:</strong> ${escapeHtml(details.focus)}</p>
  <p class="small"><strong>LNO Watch:</strong> ${escapeHtml(details.watch)}</p>
  <div class="field">
    <label>Location / Hex</label>
    <input value="${escapeHtml(fos.number)}" onchange="updateFos(${index}, 'number', this.value)"
      placeholder="Ex: Kadena AB / Hex 407" />
  </div>
  <div class="field">
    <label>Status</label>
    <select onchange="updateFos(${index}, 'status', this.value)">
      ${optionSet(["Planning", "Building", "Operational", "At Risk", "Abandoning"], fos.status)}
    </select>
  </div>
  <div class="field">
    <label>COMM Status</label>
    <select onchange="updateFos(${index}, 'comm', this.value)">
      ${optionSet(["Unknown", "Operational", "Voice Denied", "Data Denied", "COMM Denied"], fos.comm)}
    </select>
  </div>
  <div class="field">
    <label>Jammer Nearby?</label>
    <select onchange="updateFos(${index}, 'jammer', this.value)">
      ${optionSet(["No", "Yes", "Unknown"], fos.jammer)}
    </select>
  </div>
  <div class="field">
    <label>LNO Notes / Current Requirement</label>
    <textarea onchange="updateFos(${index}, 'note', this.value)"
      placeholder="RFI status, threat proximity, sortie support, COMM/GPS needs">${escapeHtml(fos.note)}</textarea>
  </div>
  `;
		grid.appendChild(div);
	});
}

function updateFos(index, key, value) {
	state.fos[index][key] = value;
	saveAll(false);
	renderFos();
}

function addThreat() {
	const item = {
		type: val("threatType"),
		location: val("threatLocation"),
		impact: val("threatImpact"),
		recommendation: val("threatRecommendation")
	};
	if (!item.location && !item.impact && !item.recommendation) return alert("Add at least a location, impact, or recommendation.");
	state.threats.push(item);
	["threatLocation", "threatImpact", "threatRecommendation"].forEach(id => document.getElementById(id).value = "");
	renderThreats();
	saveAll(false);
}

function renderThreats() {
	const tbody = document.getElementById("threatTable");
	tbody.innerHTML = state.threats.map((t, i) => `
  <tr>
    <td>${escapeHtml(t.type)}</td>
    <td>${escapeHtml(t.location)}</td>
    <td>${escapeHtml(t.impact)}</td>
    <td>${escapeHtml(t.recommendation)}</td>
    <td><button class="red" onclick="deleteThreat(${i})">Delete</button></td>
  </tr>
  `).join("") || `<tr>
    <td colspan="5" class="muted">No threats logged yet.</td>
  </tr>`;
}

function deleteThreat(index) { state.threats.splice(index, 1); renderThreats(); saveAll(false); }
function clearThreats() {
	if (confirm("Clear all threats?")) { state.threats = []; renderThreats(); saveAll(false); }
}

function addSpaceRequest() {
	const item = {
		effect: val("spaceEffect"),
		location: val("spaceLocation"),
		purpose: val("spacePurpose"),
		timing: val("spaceTiming"),
		status: "Requested"
	};
	if (!item.location && !item.purpose) return alert("Add at least a target location or purpose.");
	state.spaceRequests.push(item);
	["spaceLocation", "spacePurpose", "spaceTiming"].forEach(id => document.getElementById(id).value = "");
	renderSpaceRequests();
	saveAll(false);
}

function renderSpaceRequests() {
	const tbody = document.getElementById("spaceTable");
	tbody.innerHTML = state.spaceRequests.map((r, i) => `
  <tr>
    <td>${escapeHtml(r.effect)}</td>
    <td>${escapeHtml(r.location)}</td>
    <td>${escapeHtml(r.purpose)}</td>
    <td>${escapeHtml(r.timing)}</td>
    <td>
      <select onchange="updateSpaceStatus(${i}, this.value)">
        ${optionSet(["Requested", "Approved", "Denied", "Complete", "Pending"], r.status)}
      </select>
    </td>
    <td><button class="red" onclick="deleteSpaceRequest(${i})">Delete</button></td>
  </tr>
  `).join("") || `<tr>
    <td colspan="6" class="muted">No space effects requested yet.</td>
  </tr>`;
}

function updateSpaceStatus(index, status) { state.spaceRequests[index].status = status; saveAll(false); }
function deleteSpaceRequest(index) { state.spaceRequests.splice(index, 1); renderSpaceRequests(); saveAll(false); }
function clearSpaceRequests() {
	if (confirm("Clear all space requests?")) {
		state.spaceRequests = [];
		renderSpaceRequests(); saveAll(false);
	}
}

function buildReport() {
	const mob = document.getElementById("mobBase")?.value || "MOB";
	const look = document.getElementById("currentLook")?.value || "Current Look";
	const report = `${mob} | ${look}\nTHREAT: ${val("reportThreat") || "N/A"}\nIMPACT: ${val("reportImpact") ||
		"N/A"}\nRECOMMENDATION: ${val("reportRec") || "N/A"}`;
	document.getElementById("generatedReport").textContent = report;
	saveAll(false);
}

function copyReport() {
	const text = document.getElementById("generatedReport").textContent;
	navigator.clipboard.writeText(text).then(() => alert("Report copied."));
}

function addLog() {
	const item = { time: val("logTime"), entry: val("logEntry") };
	if (!item.time && !item.entry) return alert("Add a time/turn/phase or entry.");
	state.logs.push(item);
	document.getElementById("logTime").value = "";
	document.getElementById("logEntry").value = "";
	renderLogs();
	saveAll(false);
}

function renderLogs() {
	const tbody = document.getElementById("logTable");
	tbody.innerHTML = state.logs.map((l, i) => `
  <tr>
    <td>${escapeHtml(l.time)}</td>
    <td>${escapeHtml(l.entry)}</td>
    <td><button class="red" onclick="deleteLog(${i})">Delete</button></td>
  </tr>
  `).join("") || `<tr>
    <td colspan="3" class="muted">No log entries yet.</td>
  </tr>`;
}

function deleteLog(index) { state.logs.splice(index, 1); renderLogs(); saveAll(false); }
function clearLog() { if (confirm("Clear decision log?")) { state.logs = []; renderLogs(); saveAll(false); } }