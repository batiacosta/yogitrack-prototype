
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("classForm");
  if (!form) return;
  populateClassDropdown();
  populateInstructorDropdown();
  fetchAndDisplayClasses();
  setupDaytimeFields();

  document.getElementById("addClassBtn").addEventListener("click", () => {
    form.reset();
    clearDaytimeList();
  });

  document.getElementById("saveClassBtn").addEventListener("click", async () => {
    const classData = {
      classId: form.classId.value || undefined,
      className: form.className.value.trim(),
      instructorId: form.instructorId.value,
      classType: form.classType.value,
      description: form.description.value.trim(),
      daytime: getDaytimeList()
    };
    if (!classData.className || !classData.instructorId || !classData.classType || classData.daytime.length === 0) {
      alert("Please fill all required fields and add at least one day/time.");
      return;
    }
    try {
      const res = await fetch("/api/class/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData)
      });
      const result = await res.json();
      if (res.status === 409 && result.alternatives) {
        alert("Schedule conflict! Try these times: " + result.alternatives.join(", "));
        return;
      }
      if (!res.ok) throw new Error(result.message || "Failed to add class");
      alert(`✅ Class ${result.classId} added successfully!`);
      form.reset();
      clearDaytimeList();
      fetchAndDisplayClasses();
      populateClassDropdown();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  });
});

async function populateClassDropdown() {
  const select = document.getElementById("classIdSelect");
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Class --</option>';
  try {
    const res = await fetch("/api/class/list");
    if (!res.ok) return;
    const classes = await res.json();
    classes.forEach(cls => {
      if (cls.classId && cls.className) {
        const option = document.createElement("option");
        option.value = cls.classId;
        option.textContent = `${cls.className} (${cls.classId})`;
        select.appendChild(option);
      }
    });
  } catch {}
  // Only add one event listener
  select.onchange = async function() {
    const selectedId = select.value;
    if (!selectedId) return;
    const res = await fetch("/api/class/list");
    if (!res.ok) return;
    const classes = await res.json();
    const cls = classes.find(c => c.classId === selectedId);
    if (cls) fillClassForm(cls);
  };
}

async function populateInstructorDropdown() {
  const select = document.getElementById("instructorIdSelect");
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Instructor --</option>';
  try {
    const res = await fetch("/api/instructor/getInstructorIds");
    if (!res.ok) return;
    const instructors = await res.json();
    instructors.forEach(instr => {
      const option = document.createElement("option");
      option.value = instr.instructorId;
      option.textContent = `${instr.firstname} ${instr.lastname} (${instr.instructorId})`;
      select.appendChild(option);
    });
  } catch {}
}

function fillClassForm(cls) {
  const form = document.getElementById("classForm");
  form.className.value = cls.className || "";
  form.instructorId.value = cls.instructorId || "";
  form.classType.value = cls.classType || "General";
  form.description.value = cls.description || "";
  clearDaytimeList();
  if (Array.isArray(cls.daytime)) {
    cls.daytime.forEach(dt => addDaytimeToList(dt.day, dt.time, dt.duration));
  }
}

function setupDaytimeFields() {
  const listDiv = document.getElementById("daytimeList");
  const addBtn = document.getElementById("addDaytimeBtn");
  addBtn.addEventListener("click", () => {
    const day = prompt("Day (e.g. Mon)");
    const time = prompt("Time (HH:MM, 24h)");
    const duration = prompt("Duration (minutes)");
    if (day && time && duration) {
      addDaytimeToList(day, time, duration);
    }
  });
}

function addDaytimeToList(day, time, duration) {
  const listDiv = document.getElementById("daytimeList");
  const entry = document.createElement("div");
  entry.textContent = `${day} ${time} (${duration} min)`;
  entry.dataset.day = day;
  entry.dataset.time = time;
  entry.dataset.duration = duration;
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = () => entry.remove();
  entry.appendChild(removeBtn);
  listDiv.appendChild(entry);
}

function getDaytimeList() {
  const listDiv = document.getElementById("daytimeList");
  return Array.from(listDiv.children).map(entry => ({
    day: entry.dataset.day,
    time: entry.dataset.time,
    duration: Number(entry.dataset.duration)
  }));
}

function clearDaytimeList() {
  const listDiv = document.getElementById("daytimeList");
  listDiv.innerHTML = "";
}

async function fetchAndDisplayClasses() {
  try {
    const res = await fetch("/api/class/list");
    if (!res.ok) throw new Error("Failed to fetch classes");
    const classes = await res.json();
    const tbody = document.querySelector("#classListTable tbody");
    tbody.innerHTML = "";
    classes.forEach(cls => {
      // Prepare day/time/duration as comma-separated lists
      let days = "";
      let times = "";
      let durations = "";
      if (Array.isArray(cls.daytime)) {
        days = cls.daytime.map(dt => dt.day).join(", ");
        times = cls.daytime.map(dt => dt.time).join(", ");
        durations = cls.daytime.map(dt => dt.duration + " min").join(", ");
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${cls.classId}</td>
        <td>${cls.instructorId}</td>
        <td>${days}</td>
        <td>${times}</td>
        <td>${cls.classType}</td>
        <td>${durations}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching classes:", err.message);}
}
