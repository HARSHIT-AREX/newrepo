document.addEventListener("DOMContentLoaded", () => {
  const menuBtns=document.querySelectorAll(".menu-btn");
  const panels=document.querySelectorAll(".panel");
  menuBtns.forEach(btn=>{
    btn.addEventListener("click",()=>{
      menuBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      panels.forEach(p=>p.classList.remove("active"));
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });

  let patients=JSON.parse(localStorage.getItem("patients"))||[];
  let appointments=JSON.parse(localStorage.getItem("appointments"))||[];
  let therapies=JSON.parse(localStorage.getItem("therapies"))||[];
  let bills=JSON.parse(localStorage.getItem("bills"))||[];

  // Patients
  const patientsPanel=document.getElementById("patients");
  patientsPanel.innerHTML=`
    <h3>Patients</h3>
    <form id="patientForm">
      <input name="name" placeholder="Name" required>
      <input name="age" type="number" placeholder="Age" required>
      <input name="contact" placeholder="Contact" required>
      <button type="submit" class="btn">Add Patient</button>
    </form>
    <table><thead><tr><th>Name</th><th>Age</th><th>Contact</th><th>Action</th></tr></thead><tbody id="patientsTable"></tbody></table>
  `;
  const patientsTable=document.getElementById("patientsTable");
  document.getElementById("patientForm").addEventListener("submit",e=>{
    e.preventDefault();
    const f=e.target;
    patients.push({name:f.name.value,age:f.age.value,contact:f.contact.value});
    localStorage.setItem("patients",JSON.stringify(patients));
    f.reset(); renderPatients();
  });
  function renderPatients(){
    patientsTable.innerHTML="";
    patients.forEach(p=>{
      patientsTable.innerHTML+=`<tr><td>${p.name}</td><td>${p.age}</td><td>${p.contact}</td>
        <td><button class="btn" onclick="sendSMS('Patient ${p.name}')">Send SMS</button></td></tr>`;
    });
    document.getElementById("summaryPatients").innerText=`Patients: ${patients.length}`;
    updateChart();
  }

  // Appointments
  const apptPanel=document.getElementById("appointments");
  apptPanel.innerHTML=`
    <h3>Appointments</h3>
    <form id="apptForm">
      <input name="patient" placeholder="Patient Name" required>
      <input name="date" type="date" required>
      <input name="doctor" placeholder="Doctor" required>
      <button type="submit" class="btn">Book</button>
    </form>
    <table><thead><tr><th>Patient</th><th>Date</th><th>Doctor</th><th>Action</th></tr></thead><tbody id="apptTable"></tbody></table>
  `;
  const apptTable=document.getElementById("apptTable");
  document.getElementById("apptForm").addEventListener("submit",e=>{
    e.preventDefault();
    const f=e.target;
    appointments.push({patient:f.patient.value,date:f.date.value,doctor:f.doctor.value});
    localStorage.setItem("appointments",JSON.stringify(appointments));
    f.reset(); renderAppts();
  });
  function renderAppts(){
    apptTable.innerHTML="";
    appointments.forEach(a=>{
      apptTable.innerHTML+=`<tr><td>${a.patient}</td><td>${a.date}</td><td>${a.doctor}</td>
        <td><button class="btn" onclick="sendSMS('Appointment for ${a.patient}')">Send SMS</button></td></tr>`;
    });
    document.getElementById("summaryAppointments").innerText=`Appointments: ${appointments.length}`;
    updateChart();
  }

  // Therapies
  const therPanel=document.getElementById("therapies");
  therPanel.innerHTML=`
    <h3>Therapies</h3>
    <form id="therForm">
      <input name="patient" placeholder="Patient Name" required>
      <input name="therapy" placeholder="Therapy Type" required>
      <button type="submit" class="btn">Add</button>
    </form>
    <table><thead><tr><th>Patient</th><th>Therapy</th><th>Action</th></tr></thead><tbody id="therTable"></tbody></table>
  `;
  const therTable=document.getElementById("therTable");
  document.getElementById("therForm").addEventListener("submit",e=>{
    e.preventDefault();
    const f=e.target;
    therapies.push({patient:f.patient.value,therapy:f.therapy.value});
    localStorage.setItem("therapies",JSON.stringify(therapies));
    f.reset(); renderTher();
  });
  function renderTher(){
    therTable.innerHTML="";
    therapies.forEach(t=>{
      therTable.innerHTML+=`<tr><td>${t.patient}</td><td>${t.therapy}</td>
        <td><button class="btn" onclick="sendSMS('Therapy for ${t.patient}')">Send SMS</button></td></tr>`;
    });
    document.getElementById("summaryTherapies").innerText=`Therapies: ${therapies.length}`;
    updateChart();
  }

  // Billing
  const billPanel=document.getElementById("billing");
  billPanel.innerHTML=`
    <h3>Billing</h3>
    <form id="billForm">
      <input name="patient" placeholder="Patient Name" required>
      <input name="amount" type="number" placeholder="Amount" required>
      <button type="submit" class="btn">Add Bill</button>
    </form>
    <table><thead><tr><th>Patient</th><th>Amount</th><th>Action</th></tr></thead><tbody id="billTable"></tbody></table>
  `;
  const billTable=document.getElementById("billTable");
  document.getElementById("billForm").addEventListener("submit",e=>{
    e.preventDefault();
    const f=e.target;
    bills.push({patient:f.patient.value,amount:parseInt(f.amount.value)});
    localStorage.setItem("bills",JSON.stringify(bills));
    f.reset(); renderBills();
  });
  function renderBills(){
    billTable.innerHTML=""; let revenue=0;
    bills.forEach(b=>{
      revenue+=b.amount;
      billTable.innerHTML+=`<tr><td>${b.patient}</td><td>₹${b.amount}</td>
        <td><button class="btn" onclick="sendSMS('Bill ₹${b.amount} for ${b.patient}')">Send SMS</button></td></tr>`;
    });
    document.getElementById("summaryRevenue").innerText=`Revenue: ₹${revenue}`;
    updateChart();
  }

  // Analytics
  const anaPanel=document.getElementById("analytics");
  anaPanel.innerHTML=`<h3>Analytics</h3><canvas id="chart"></canvas>`;
  const ctx=document.getElementById("chart").getContext("2d");
  let chart=new Chart(ctx,{type:"bar",data:{labels:["Patients","Appointments","Therapies","Revenue"],
    datasets:[{label:"Overview",data:[patients.length,appointments.length,therapies.length,bills.reduce((t,b)=>t+b.amount,0)],backgroundColor:["#4caf50","#81c784","#aed581","#2e7d32"]}]}});
  function updateChart(){
    chart.data.datasets[0].data=[patients.length,appointments.length,therapies.length,bills.reduce((t,b)=>t+b.amount,0)];
    chart.update();
  }

  // SMS Demo
  window.sendSMS=function(msg){alert("✅ SMS Sent: "+msg);}
  // Render all
  renderPatients();renderAppts();renderTher();renderBills();

  // Logout
  document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.clear();window.location.href="login.html";});
});
