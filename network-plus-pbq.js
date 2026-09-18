/* ---------- TAB SWITCHING ---------- */
function activatePanel(name){
  const valid = ["net","impl","trouble","sec"];
  if(!valid.includes(name)) name = "net";
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active", b.dataset.panel===name));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active", p.id==="panel-"+name));
  document.querySelectorAll(".pbq-nav a[data-panel-link]").forEach(a=>a.classList.toggle("current", a.dataset.panelLink===name));
}
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    history.replaceState(null,"","#"+btn.dataset.panel);
    activatePanel(btn.dataset.panel);
  });
});
window.addEventListener("hashchange", ()=> activatePanel(location.hash.replace("#","")));
activatePanel(location.hash.replace("#",""));

/* shared radio-option builder */
function buildOptions(containerId, options){
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  el.dataset.picked = "";
  options.forEach(opt=>{
    const span = document.createElement("span");
    span.className = "radio-opt";
    span.textContent = opt.label;
    span.dataset.value = opt.value;
    span.addEventListener("click", ()=>{
      el.querySelectorAll(".radio-opt").forEach(s=>s.classList.remove("picked"));
      span.classList.add("picked");
      el.dataset.picked = opt.value;
    });
    el.appendChild(span);
  });
}

/* shared question-card block builder (matches cysa-pbq.js pattern) */
function buildQBlock(containerId, scenarios){
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  scenarios.forEach(s=>{
    const block = document.createElement("div");
    block.className = "qblock";
    block.dataset.answer = s.answer;
    block.dataset.picked = "";
    const qrow = document.createElement("div");
    qrow.className = "qrow";
    s.options.forEach(opt=>{
      const span = document.createElement("span");
      span.className = "radio-opt";
      span.textContent = opt.label;
      span.dataset.value = opt.value;
      span.addEventListener("click", ()=>{
        qrow.querySelectorAll(".radio-opt").forEach(o=>o.classList.remove("picked"));
        span.classList.add("picked");
        block.dataset.picked = opt.value;
      });
      qrow.appendChild(span);
    });
    block.innerHTML = `<div class="qtext">${s.q}</div>`;
    block.appendChild(qrow);
    const explainDiv = document.createElement("div");
    explainDiv.className = "explain";
    explainDiv.textContent = s.explain;
    block.appendChild(explainDiv);
    container.appendChild(block);
  });
}

/* grade a set of .qblock cards inside a container, wire up a submit/reset pair */
function wireQBlockGrading(containerSelector, submitId, resetId, scoreId, passMsg, failMsg){
  document.getElementById(submitId).addEventListener("click", ()=>{
    let correct = 0, total = 0;
    document.querySelectorAll(containerSelector + " .qblock").forEach(block=>{
      total++;
      const isCorrect = block.dataset.picked === block.dataset.answer;
      if(isCorrect) correct++;
      block.querySelectorAll(".radio-opt").forEach(o=>{
        o.style.borderColor = o.dataset.value===block.dataset.answer ? "var(--ok)" : (o.classList.contains("picked") ? "var(--bad)" : "var(--line)");
      });
      block.querySelector(".explain").style.display = "block";
    });
    const panel = document.getElementById(scoreId);
    panel.classList.add("visible");
    document.getElementById(scoreId+"-num").textContent = `${correct}/${total}`;
    document.getElementById(scoreId+"-num").className = "score-num " + (correct===total?"pass":"fail");
    document.getElementById(scoreId+"-msg").textContent = correct===total ? passMsg : failMsg;
  });
  document.getElementById(resetId).addEventListener("click", ()=>{
    document.querySelectorAll(containerSelector + " .qblock").forEach(block=>{
      block.dataset.picked = "";
      block.querySelectorAll(".radio-opt").forEach(o=>{o.classList.remove("picked"); o.style.borderColor="var(--line)";});
      block.querySelector(".explain").style.display = "none";
    });
    document.getElementById(scoreId).classList.remove("visible");
  });
}

/* ================= TAB 1: SUBNETTING & ADDRESSING ================= */
const subnetSegments = [
  {segment:"Warehouse Floor (scanners, forklifts, IoT sensors)", hosts:"50",
   correct:"26",
   explain:"50 hosts needs at least 6 host bits (2⁶−2 = 62 ≥ 50). A /26 covers it with the least waste — a /25 would also fit but hands out 126 addresses for a 50-host need."},
  {segment:"Office LAN (desks, printers, VoIP phones)", hosts:"20",
   correct:"27",
   explain:"20 hosts needs 5 host bits (2⁵−2 = 30 ≥ 20). A /27 is the tightest fit."},
  {segment:"Server / Management VLAN", hosts:"10",
   correct:"28",
   explain:"10 hosts needs 4 host bits (2⁴−2 = 14 ≥ 10). A /28 fits with a little headroom for growth."},
  {segment:"Router-to-router WAN link back to HQ", hosts:"2",
   correct:"30",
   explain:"A point-to-point link only ever needs 2 usable addresses, one per end — the textbook case for a /30 (2²−2 = 2)."},
];
const cidrOptions = [
  {v:"", label:"— choose —"},
  {v:"24", label:"/24 — 254 hosts"},
  {v:"25", label:"/25 — 126 hosts"},
  {v:"26", label:"/26 — 62 hosts"},
  {v:"27", label:"/27 — 30 hosts"},
  {v:"28", label:"/28 — 14 hosts"},
  {v:"29", label:"/29 — 6 hosts"},
  {v:"30", label:"/30 — 2 hosts"},
];
const subnetBody = document.getElementById("subnet-body");
subnetSegments.forEach((s,i)=>{
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><span class="verdict-icon" id="subnet-icon-${i}"></span></td>
    <td>${s.segment}</td>
    <td>${s.hosts}</td>
    <td>
      <select id="subnet-sel-${i}">
        ${cidrOptions.map(o=>`<option value="${o.v}">${o.label}</option>`).join("")}
      </select>
    </td>`;
  subnetBody.appendChild(tr);
  const explainRow = document.createElement("tr");
  explainRow.innerHTML = `<td colspan="4"><div class="explain" id="subnet-explain-${i}">${s.explain}</div></td>`;
  subnetBody.appendChild(explainRow);
});
document.getElementById("subnet-submit").addEventListener("click", ()=>{
  let correct = 0, unanswered = 0;
  subnetSegments.forEach((s,i)=>{
    const sel = document.getElementById(`subnet-sel-${i}`);
    const row = sel.closest("tr");
    const icon = document.getElementById(`subnet-icon-${i}`);
    const explainDiv = document.getElementById(`subnet-explain-${i}`);
    if(!sel.value){ unanswered++; return; }
    const isCorrect = sel.value === s.correct;
    if(isCorrect) correct++;
    icon.textContent = isCorrect ? "✓" : "✗";
    icon.className = "verdict-icon " + (isCorrect ? "ok" : "bad");
    row.classList.toggle("graded-correct", isCorrect);
    row.classList.toggle("graded-wrong", !isCorrect);
    explainDiv.closest("tr").classList.add("show-explain");
  });
  const panel = document.getElementById("subnet-score");
  panel.classList.add("visible");
  document.getElementById("subnet-score-num").textContent = `${correct}/${subnetSegments.length}`;
  document.getElementById("subnet-score-num").className = "score-num " + (correct===subnetSegments.length?"pass":"fail");
  document.getElementById("subnet-score-msg").textContent = unanswered>0
    ? `${unanswered} segment(s) left unset — pick a subnet for every row, then resubmit.`
    : (correct===subnetSegments.length ? "Every subnet is sized to the requirement with minimal waste — that's VLSM working as intended." : "Check the highlighted rows — the explanation under each shows the host-bit math.");
});
document.getElementById("subnet-reset").addEventListener("click", ()=>{
  subnetSegments.forEach((s,i)=>{
    document.getElementById(`subnet-sel-${i}`).value = "";
    document.getElementById(`subnet-icon-${i}`).textContent = "";
    const row = document.getElementById(`subnet-sel-${i}`).closest("tr");
    row.classList.remove("graded-correct","graded-wrong");
    document.getElementById(`subnet-explain-${i}`).closest("tr").classList.remove("show-explain");
  });
  document.getElementById("subnet-score").classList.remove("visible");
});

const subnetQuiz = [
  {q:"How many usable host addresses are available on a /27 subnet?",
   options:[{label:"14",value:"14"},{label:"30",value:"30"},{label:"62",value:"62"},{label:"126",value:"126"}],
   answer:"30",
   explain:"/27 leaves 5 host bits: 2⁵ − 2 (network and broadcast addresses) = 30 usable hosts."},
  {q:"What is the broadcast address for the subnet 192.168.10.64/26?",
   options:[{label:"192.168.10.95",value:"95"},{label:"192.168.10.127",value:"127"},{label:"192.168.10.128",value:"128"},{label:"192.168.10.191",value:"191"}],
   answer:"127",
   explain:"A /26 splits the block into chunks of 64: .0–.63, .64–.127, .128–.191, .192–.255. The .64 block's broadcast address is the last address in that range, .127."},
];
buildQBlock("subnet-quiz-block", subnetQuiz);
wireQBlockGrading("#subnet-quiz-block", "subnetquiz-submit", "subnetquiz-reset", "subnetquiz-score",
  "Both answers check out — the host-bit math and the block-boundary math are the two skills VLSM questions test.",
  "Check each card's explanation below — both come down to counting host bits correctly.");

/* ================= TAB 2: CABLING & CONNECTORS + PORTS ================= */
const cableScenarios = [
  {req:"Desk drops from the wiring closet to workstations", notes:"~40m runs, needs Gigabit", correct:"cat6",
   explain:"Well within copper's 100m limit, and Cat6 comfortably handles Gigabit (and even 10GBase-T at shorter range)."},
  {req:"Backbone link from the distribution center to HQ", notes:"15 km apart", correct:"smf",
   explain:"Single-mode fiber is built for long-haul runs of kilometers with minimal signal loss — multimode tops out at a few hundred meters."},
  {req:"Inter-rack link within the same server cabinet", notes:"Very short run, high throughput needed", correct:"twinax",
   explain:"For short, high-speed rack-to-rack links, a Direct Attach Copper (Twinax) cable is cheaper and lower-latency than fiber transceivers, and easily covers the distance."},
  {req:"Riser link between two IDFs on different floors", notes:"~150m, needs 10Gbps", correct:"mmf",
   explain:"150m exceeds copper's 100m limit. Multimode fiber is the standard, more affordable choice for these shorter in-building backbone runs."},
  {req:"Legacy analog line to an old fax machine", notes:"Voice-grade only", correct:"cat3",
   explain:"Analog voice/fax lines use Cat3-rated cable terminated with an RJ11 connector, not the RJ45 used for Ethernet."},
  {req:"Cable ISP hand-off into the building", notes:"From the demarc to the modem", correct:"coax",
   explain:"Cable internet service typically arrives on coax with an F-type connector before the modem converts it to Ethernet."},
];
const cableOptions = [
  {v:"", label:"— choose —"},
  {v:"cat6", label:"Cat6 UTP — RJ45"},
  {v:"cat3", label:"Cat3 UTP — RJ11"},
  {v:"mmf", label:"Multimode Fiber — LC"},
  {v:"smf", label:"Single-mode Fiber — SC/LC"},
  {v:"coax", label:"Coaxial — F-connector"},
  {v:"twinax", label:"Twinax — SFP+ DAC"},
];
const cableBody = document.getElementById("cable-body");
cableScenarios.forEach((c,i)=>{
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><span class="verdict-icon" id="cable-icon-${i}"></span></td>
    <td>${c.req}</td>
    <td>${c.notes}</td>
    <td>
      <select id="cable-sel-${i}">
        ${cableOptions.map(o=>`<option value="${o.v}">${o.label}</option>`).join("")}
      </select>
    </td>`;
  cableBody.appendChild(tr);
  const explainRow = document.createElement("tr");
  explainRow.innerHTML = `<td colspan="4"><div class="explain" id="cable-explain-${i}">${c.explain}</div></td>`;
  cableBody.appendChild(explainRow);
});
document.getElementById("cable-submit").addEventListener("click", ()=>{
  let correct = 0, unanswered = 0;
  cableScenarios.forEach((c,i)=>{
    const sel = document.getElementById(`cable-sel-${i}`);
    const row = sel.closest("tr");
    const icon = document.getElementById(`cable-icon-${i}`);
    const explainDiv = document.getElementById(`cable-explain-${i}`);
    if(!sel.value){ unanswered++; return; }
    const isCorrect = sel.value === c.correct;
    if(isCorrect) correct++;
    icon.textContent = isCorrect ? "✓" : "✗";
    icon.className = "verdict-icon " + (isCorrect ? "ok" : "bad");
    row.classList.toggle("graded-correct", isCorrect);
    row.classList.toggle("graded-wrong", !isCorrect);
    explainDiv.closest("tr").classList.add("show-explain");
  });
  const panel = document.getElementById("cable-score");
  panel.classList.add("visible");
  document.getElementById("cable-score-num").textContent = `${correct}/${cableScenarios.length}`;
  document.getElementById("cable-score-num").className = "score-num " + (correct===cableScenarios.length?"pass":"fail");
  document.getElementById("cable-score-msg").textContent = unanswered>0
    ? `${unanswered} requirement(s) left unset — pick a cable/connector for every row, then resubmit.`
    : (correct===cableScenarios.length ? "Distance, bandwidth, and environment all point to the right medium here." : "Check the highlighted rows — each explanation ties back to the 100m copper limit or the distance/throughput the medium is built for.");
});
document.getElementById("cable-reset").addEventListener("click", ()=>{
  cableScenarios.forEach((c,i)=>{
    document.getElementById(`cable-sel-${i}`).value = "";
    document.getElementById(`cable-icon-${i}`).textContent = "";
    const row = document.getElementById(`cable-sel-${i}`).closest("tr");
    row.classList.remove("graded-correct","graded-wrong");
    document.getElementById(`cable-explain-${i}`).closest("tr").classList.remove("show-explain");
  });
  document.getElementById("cable-score").classList.remove("visible");
});

const portScenarios = [
  {q:"Which port does DNS use by default?",
   options:[{label:"53",value:"53"},{label:"443",value:"443"},{label:"25",value:"25"},{label:"3389",value:"3389"}],
   answer:"53", explain:"DNS listens on port 53 for both UDP queries and TCP zone transfers/large responses."},
  {q:"Which port does HTTPS use?",
   options:[{label:"80",value:"80"},{label:"443",value:"443"},{label:"21",value:"21"},{label:"110",value:"110"}],
   answer:"443", explain:"HTTPS (HTTP over TLS) uses port 443; plain HTTP uses 80."},
  {q:"Which port does SSH use?",
   options:[{label:"22",value:"22"},{label:"23",value:"23"},{label:"25",value:"25"},{label:"3306",value:"3306"}],
   answer:"22", explain:"SSH's well-known port is 22 — easy to confuse with Telnet's 23, which is unencrypted."},
  {q:"Which port does RDP use?",
   options:[{label:"3389",value:"3389"},{label:"3306",value:"3306"},{label:"1433",value:"1433"},{label:"5900",value:"5900"}],
   answer:"3389", explain:"Microsoft's Remote Desktop Protocol listens on TCP 3389."},
];
buildQBlock("ports-block", portScenarios);
wireQBlockGrading("#ports-block", "ports-submit", "ports-reset", "ports-score",
  "All four well-known ports correct — these come up constantly on the exam, worth memorizing cold.",
  "Check each card's explanation below.");

/* ================= TAB 3: TROUBLESHOOTING METHODOLOGY ================= */
const methodCorrectOrder = [
  {id:"identify", text:"Identify the problem"},
  {id:"theory", text:"Establish a theory of probable cause (question the obvious)"},
  {id:"test", text:"Test the theory to determine the cause"},
  {id:"plan", text:"Establish a plan of action to resolve the problem and identify potential effects"},
  {id:"implement", text:"Implement the solution or escalate as necessary"},
  {id:"verify", text:"Verify full system functionality and, if applicable, implement preventive measures"},
  {id:"document", text:"Document findings, actions, outcomes, and lessons learned"},
];
let methodOrder = shuffleArr([...methodCorrectOrder]);
function shuffleArr(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  if(JSON.stringify(arr)===JSON.stringify(methodCorrectOrder)){ [arr[0],arr[1]]=[arr[1],arr[0]]; }
  return arr;
}
let methodDragSrcIdx = null;
function renderMethodList(){
  const ul = document.getElementById("method-list");
  ul.innerHTML = "";
  methodOrder.forEach((step,i)=>{
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = step.id;
    li.innerHTML = `<span class="handle">⠿</span><span class="step-num">${i+1}.</span><span class="step-text">${step.text}</span><span class="step-tag">correct step: ${methodCorrectOrder.findIndex(s=>s.id===step.id)+1}</span>`;
    li.addEventListener("dragstart", e=>{ methodDragSrcIdx = i; li.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; });
    li.addEventListener("dragend", ()=> li.classList.remove("dragging"));
    li.addEventListener("dragover", e=>{
      e.preventDefault();
      if(methodDragSrcIdx===null || methodDragSrcIdx===i) return;
      const moved = methodOrder.splice(methodDragSrcIdx,1)[0];
      methodOrder.splice(i,0,moved);
      methodDragSrcIdx = i;
      renderMethodList();
    });
    ul.appendChild(li);
  });
}
renderMethodList();
document.getElementById("method-submit").addEventListener("click", ()=>{
  let correct = 0;
  const ul = document.getElementById("method-list");
  methodOrder.forEach((step,i)=>{
    const li = ul.children[i];
    li.classList.add("graded");
    const isCorrect = methodCorrectOrder[i].id === step.id;
    if(isCorrect) correct++;
    li.classList.toggle("graded-correct", isCorrect);
    li.classList.toggle("graded-wrong", !isCorrect);
  });
  const panel = document.getElementById("method-score");
  panel.classList.add("visible");
  document.getElementById("method-score-num").textContent = `${correct}/${methodOrder.length}`;
  document.getElementById("method-score-num").className = "score-num " + (correct===methodOrder.length?"pass":"fail");
  document.getElementById("method-score-msg").textContent = correct===methodOrder.length
    ? "That's CompTIA's official troubleshooting methodology, start to finish."
    : "Rows in red are out of place. \"Correct step\" on the right shows where each one actually belongs — drag to fix and resubmit.";
});
document.getElementById("method-reset").addEventListener("click", ()=>{
  methodOrder = shuffleArr([...methodCorrectOrder]);
  renderMethodList();
  document.getElementById("method-score").classList.remove("visible");
});

const toolScenarios = [
  {q:"You need to confirm a remote host is reachable and measure round-trip latency.",
   options:[{label:"ping",value:"ping"},{label:"netstat",value:"netstat"},{label:"arp",value:"arp"},{label:"dig",value:"dig"}],
   answer:"ping", explain:"ping sends ICMP echo requests and reports round-trip time — the first tool for a basic reachability check."},
  {q:"You need to see the hop-by-hop path packets take to a destination, to find where latency spikes.",
   options:[{label:"traceroute / tracert",value:"traceroute"},{label:"ipconfig",value:"ipconfig"},{label:"nslookup",value:"nslookup"},{label:"ping",value:"ping"}],
   answer:"traceroute", explain:"traceroute (tracert on Windows) reveals each router hop along the path and the latency at each one."},
  {q:"You need to verify what IP address, subnet mask, and default gateway a Windows workstation currently has.",
   options:[{label:"ipconfig",value:"ipconfig"},{label:"netstat",value:"netstat"},{label:"arp",value:"arp"},{label:"nslookup",value:"nslookup"}],
   answer:"ipconfig", explain:"ipconfig (ifconfig/ip addr on Linux/macOS) prints the current interface configuration — address, mask, gateway."},
  {q:"You need to capture and inspect the actual packets crossing a link to see which protocol is misbehaving.",
   options:[{label:"Wireshark (packet sniffer)",value:"wireshark"},{label:"ping",value:"ping"},{label:"tracert",value:"tracert"},{label:"nslookup",value:"nslookup"}],
   answer:"wireshark", explain:"A packet sniffer like Wireshark captures raw traffic for inspection — the right tool when you need to see exactly what's on the wire, not just whether a host responds."},
];
buildQBlock("tool-block", toolScenarios);
wireQBlockGrading("#tool-block", "tool-submit", "tool-reset", "tool-score",
  "Right tool for each job — reachability, path, local config, and packet-level detail all call for different utilities.",
  "Check each card's explanation below.");

/* ================= TAB 4: NETWORK SECURITY — VLAN PLACEMENT ================= */
const vlanDevices = [
  {device:"Office workstations and VoIP phones", notes:"Standard employee devices", correct:"10",
   explain:"Ordinary corporate endpoints with no unusual isolation needs belong on the standard Corporate LAN VLAN."},
  {device:"Handheld barcode scanners and forklift telemetry", notes:"IoT-class devices, limited patching", correct:"20",
   explain:"IoT-class devices with weaker security postures should be isolated so a compromise can't spread laterally into the corporate LAN."},
  {device:"Visitor / driver Wi-Fi in the lobby", notes:"Untrusted, external users", correct:"30",
   explain:"Guest access should never share a broadcast domain with internal systems — a dedicated Guest VLAN with no route to internal resources."},
  {device:"Switch and router management interfaces", notes:"SSH/HTTPS admin access", correct:"99",
   explain:"Management interfaces belong on a dedicated, restricted VLAN reachable only from specific admin hosts — never mixed in with user traffic."},
  {device:"Security camera and badge reader controllers", notes:"Embedded IoT-class devices", correct:"20",
   explain:"Like the scanners, these are embedded devices that belong in the isolated IoT segment rather than the corporate LAN."},
  {device:"Finance department's payroll workstation", notes:"Standard corporate endpoint", correct:"10",
   explain:"Sensitive, but still a standard corporate endpoint — it needs endpoint-level controls and ACLs, not a separate device-class VLAN."},
];
const vlanOptions = [
  {v:"", label:"— choose —"},
  {v:"10", label:"VLAN 10 — Corporate LAN"},
  {v:"20", label:"VLAN 20 — Warehouse IoT/Scanners"},
  {v:"30", label:"VLAN 30 — Guest Wi-Fi"},
  {v:"99", label:"VLAN 99 — Management"},
];
const vlanBody = document.getElementById("vlan-body");
vlanDevices.forEach((v,i)=>{
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><span class="verdict-icon" id="vlan-icon-${i}"></span></td>
    <td>${v.device}</td>
    <td>${v.notes}</td>
    <td>
      <select id="vlan-sel-${i}">
        ${vlanOptions.map(o=>`<option value="${o.v}">${o.label}</option>`).join("")}
      </select>
    </td>`;
  vlanBody.appendChild(tr);
  const explainRow = document.createElement("tr");
  explainRow.innerHTML = `<td colspan="4"><div class="explain" id="vlan-explain-${i}">${v.explain}</div></td>`;
  vlanBody.appendChild(explainRow);
});
document.getElementById("vlan-submit").addEventListener("click", ()=>{
  let correct = 0, unanswered = 0;
  vlanDevices.forEach((v,i)=>{
    const sel = document.getElementById(`vlan-sel-${i}`);
    const row = sel.closest("tr");
    const icon = document.getElementById(`vlan-icon-${i}`);
    const explainDiv = document.getElementById(`vlan-explain-${i}`);
    if(!sel.value){ unanswered++; return; }
    const isCorrect = sel.value === v.correct;
    if(isCorrect) correct++;
    icon.textContent = isCorrect ? "✓" : "✗";
    icon.className = "verdict-icon " + (isCorrect ? "ok" : "bad");
    row.classList.toggle("graded-correct", isCorrect);
    row.classList.toggle("graded-wrong", !isCorrect);
    explainDiv.closest("tr").classList.add("show-explain");
  });
  const panel = document.getElementById("vlan-score");
  panel.classList.add("visible");
  document.getElementById("vlan-score-num").textContent = `${correct}/${vlanDevices.length}`;
  document.getElementById("vlan-score-num").className = "score-num " + (correct===vlanDevices.length?"pass":"fail");
  document.getElementById("vlan-score-msg").textContent = unanswered>0
    ? `${unanswered} device(s) left unset — assign a VLAN to every row, then resubmit.`
    : (correct===vlanDevices.length ? "Clean segmentation: IoT and guest traffic both isolated, management locked down, corporate LAN reserved for corporate endpoints." : "Check the highlighted rows — the explanation under each shows why that device class needs its own segment (or doesn't).");
});
document.getElementById("vlan-reset").addEventListener("click", ()=>{
  vlanDevices.forEach((v,i)=>{
    document.getElementById(`vlan-sel-${i}`).value = "";
    document.getElementById(`vlan-icon-${i}`).textContent = "";
    const row = document.getElementById(`vlan-sel-${i}`).closest("tr");
    row.classList.remove("graded-correct","graded-wrong");
    document.getElementById(`vlan-explain-${i}`).closest("tr").classList.remove("show-explain");
  });
  document.getElementById("vlan-score").classList.remove("visible");
});

const secConceptScenarios = [
  {q:"You want to stop a rogue switch plugged into an open wall jack from participating in Spanning Tree and potentially causing a loop.",
   options:[{label:"BPDU Guard",value:"bpdu"},{label:"DHCP Snooping",value:"dhcp"},{label:"802.1X",value:"dot1x"},{label:"Port Security",value:"portsec"}],
   answer:"bpdu", explain:"BPDU Guard shuts down an access port the instant it sees a Spanning Tree BPDU — exactly the signal a rogue switch would send."},
  {q:"You want to stop an unauthorized device from handing out IP addresses from a rogue DHCP server someone plugged in.",
   options:[{label:"DHCP Snooping",value:"dhcp"},{label:"BPDU Guard",value:"bpdu"},{label:"802.1X",value:"dot1x"},{label:"ACL",value:"acl"}],
   answer:"dhcp", explain:"DHCP snooping treats untrusted ports as unable to send DHCP server responses, blocking a rogue DHCP server directly."},
  {q:"You want to require devices to authenticate with valid credentials or a certificate before they're allowed onto the network at all, port by port.",
   options:[{label:"802.1X",value:"dot1x"},{label:"DHCP Snooping",value:"dhcp"},{label:"Port Security",value:"portsec"},{label:"BPDU Guard",value:"bpdu"}],
   answer:"dot1x", explain:"802.1X is port-based network access control — it authenticates the device/user before the port is opened for normal traffic."},
  {q:"You want to restrict which specific MAC addresses are allowed to connect to a single switch port.",
   options:[{label:"Port Security",value:"portsec"},{label:"802.1X",value:"dot1x"},{label:"DHCP Snooping",value:"dhcp"},{label:"ACL",value:"acl"}],
   answer:"portsec", explain:"Port security limits and/or explicitly allow-lists the MAC address(es) permitted on a port, shutting it down or discarding traffic on a violation."},
];
buildQBlock("secconcept-block", secConceptScenarios);
wireQBlockGrading("#secconcept-block", "secconcept-submit", "secconcept-reset", "secconcept-score",
  "BPDU Guard, DHCP snooping, 802.1X, and port security each solve a different piece of access-layer security — good to have all four straight.",
  "Check each card's explanation below — these four controls are easy to mix up but solve different problems.");
