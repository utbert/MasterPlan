function getWorkHoursKey(mId, dayIdx) {
    return `${currentYear}-${mId}-${dayIdx}`;
}

function toMinutes(timeStr) {
    if(!timeStr || !timeStr.includes(':')) return null;
    const [h,m] = timeStr.split(':').map(x => parseInt(x,10));
    if(Number.isNaN(h) || Number.isNaN(m)) return null;
    return h*60+m;
}

function calcHoursFromRange(from, to, breakMin) {
    const fromMin = toMinutes(from);
    const toMin = toMinutes(to);
    if(fromMin === null || toMin === null || toMin <= fromMin) return null;
    const pause = Math.max(0, parseInt(breakMin || 0, 10));
    const worked = Math.max(0, toMin - fromMin - pause);
    return Math.round((worked / 60) * 100) / 100;
}


function getPreviousWorkRecord(mId, dayIdx) {
    for(let d=dayIdx-1; d>=0; d--) {
        const prev = state.workHours[getWorkHoursKey(mId, d)];
        if(prev && prev.from && prev.to) return prev;
    }
    return null;
}

function applyWorktimePreset(type) {
    if(type === 'full') {
        document.getElementById('wtFrom').value = '07:00';
        document.getElementById('wtTo').value = '15:30';
        document.getElementById('wtBreak').value = 30;
    } else if(type === 'short') {
        document.getElementById('wtFrom').value = '07:00';
        document.getElementById('wtTo').value = '15:00';
        document.getElementById('wtBreak').value = 30;
    } else if(type === 'off') {
        document.getElementById('wtFrom').value = '';
        document.getElementById('wtTo').value = '';
        document.getElementById('wtBreak').value = 0;
        document.getElementById('wtNote').value = 'Frei';
    }
}

function openWorkTimeContextMenu(ev, mId, dayIdx) {
    ev.preventDefault();
    ev.stopPropagation();
    const menu = document.getElementById('worktimeMenu');
    const key = getWorkHoursKey(mId, dayIdx);
    let current = state.workHours[key] || null;
    if(!current) current = getPreviousWorkRecord(mId, dayIdx) || { from:'', to:'', breakMin:0, hours:0, note:'' };

    workTimeContext = { mId, dayIdx };
    document.getElementById('wtFrom').value = current.from || '';
    document.getElementById('wtTo').value = current.to || '';
    document.getElementById('wtBreak').value = current.breakMin || 0;
    document.getElementById('wtNote').value = current.note || ''; 

    menu.style.display = 'block';
    menu.style.left = Math.min(window.innerWidth - 300, ev.clientX + 8) + 'px';
    menu.style.top = Math.min(window.innerHeight - 280, ev.clientY + 8) + 'px';
}

function closeWorkTimeContextMenu() {
    document.getElementById('worktimeMenu').style.display = 'none';
}

function saveWorkTimeFromMenu() {
    if(workTimeContext.mId === null) return;
    const from = document.getElementById('wtFrom').value;
    const to = document.getElementById('wtTo').value;
    const breakMin = parseInt(document.getElementById('wtBreak').value || 0, 10);
    const note = document.getElementById('wtNote').value || '';
    const hours = calcHoursFromRange(from, to, breakMin);
    if(hours === null) return alert('Bitte gültige Von/Bis-Zeit eingeben (Bis muss nach Von liegen).');

    const key = getWorkHoursKey(workTimeContext.mId, workTimeContext.dayIdx);
    state.workHours[key] = { from, to, breakMin: Math.max(0, breakMin), hours, note };
    saveState();
    closeWorkTimeContextMenu();
    render();
}

function deleteWorkTimeFromMenu() {
    if(workTimeContext.mId === null) return;
    const key = getWorkHoursKey(workTimeContext.mId, workTimeContext.dayIdx);
    delete state.workHours[key];
    saveState();
    closeWorkTimeContextMenu();
    render();
}

function renderWorkHoursForMonteur(mId, rowEl) {
    Object.entries(state.workHours).forEach(([key, rec]) => {
        const [year, mmId, day] = key.split('-');
        if(parseInt(year)!==currentYear || mmId!==mId) return;
        const dayIdx = parseInt(day);
        if(Number.isNaN(dayIdx) || dayIdx < 0 || dayIdx >= totalDays) return;
        const chip = document.createElement('div');
        chip.className = 'hours-chip';
        chip.style.left = (dayIdx * dayWidth + 3) + 'px';
        const hours = (typeof rec === 'number') ? rec : (rec.hours || 0);
        const from = rec.from || '--:--';
        const to = rec.to || '--:--';
        const pause = rec.breakMin || 0;
        const note = rec.note || '';
        chip.textContent = `${hours}h`;
        chip.title = `${from}-${to} | Pause ${pause}m${note ? ' | ' + note : ''}`;
        chip.onclick = ev => { ev.stopPropagation(); openWorkTimeContextMenu(ev, mId, dayIdx); };
        chip.oncontextmenu = ev => openWorkTimeContextMenu(ev, mId, dayIdx);
        rowEl.appendChild(chip);
    });
}

document.addEventListener('keydown', (e) => {
    const menu = document.getElementById('worktimeMenu');
    if(!menu || menu.style.display !== 'block') return;
    if(e.key === 'Enter') {
        e.preventDefault();
        saveWorkTimeFromMenu();
    }
});
