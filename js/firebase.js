import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
	apiKey: "AIzaSyBPBNBM6mq1s6i_7X4LTJgr9ONUXTy4oIw",
	authDomain: "mob-ops-dashboard.firebaseapp.com",
	databaseURL: "https://mob-ops-dashboard-default-rtdb.firebaseio.com",
	projectId: "mob-ops-dashboard",
	storageBucket: "mob-ops-dashboard.firebasestorage.app",
	messagingSenderId: "492770941172",
	appId: "1:492770941172:web:8d5b1df4d3b27a0ba666a1"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

window.firebaseDb = database;
window.firebaseRef = ref;
window.firebaseSet = set;
window.firebaseOnValue = onValue;