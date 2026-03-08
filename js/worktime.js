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

function openWorkTimeContextMenu(ev, mId, dayIdx) {
    ev.preventDefault();
    ev.stopPropagation();
    const menu = document.getElementById('worktimeMenu');
    const key = getWorkHoursKey(mId, dayIdx);
    const current = state.workHours[key] || { from:'', to:'', breakMin:0, hours:0 };

    workTimeContext = { mId, dayIdx };
    document.getElementById('wtFrom').value = current.from || '';
    document.getElementById('wtTo').value = current.to || '';
    document.getElementById('wtBreak').value = current.breakMin || 0;

    menu.style.display = 'block';
    menu.style.left = Math.min(window.innerWidth - 280, ev.clientX) + 'px';
    menu.style.top = Math.min(window.innerHeight - 240, ev.clientY) + 'px';
}

function closeWorkTimeContextMenu() {
    document.getElementById('worktimeMenu').style.display = 'none';
}

function saveWorkTimeFromMenu() {
    if(workTimeContext.mId === null) return;
    const from = document.getElementById('wtFrom').value;
    const to = document.getElementById('wtTo').value;
    const breakMin = parseInt(document.getElementById('wtBreak').value || 0, 10);
    const hours = calcHoursFromRange(from, to, breakMin);
    if(hours === null) return alert('Bitte gültige Von/Bis-Zeit eingeben (Bis muss nach Von liegen).');

    const key = getWorkHoursKey(workTimeContext.mId, workTimeContext.dayIdx);
    state.workHours[key] = { from, to, breakMin: Math.max(0, breakMin), hours };
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
        chip.textContent = `${hours}h`;
        chip.title = `${from}-${to} | Pause ${pause}m`;
        chip.onclick = ev => { ev.stopPropagation(); openWorkTimeContextMenu(ev, mId, dayIdx); };
        chip.oncontextmenu = ev => openWorkTimeContextMenu(ev, mId, dayIdx);
        rowEl.appendChild(chip);
    });
}
