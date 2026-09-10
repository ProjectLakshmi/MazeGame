const API_BASE = import.meta.env.VITE_APP_API_BASEURL;

function getOrCreatePlayerId(){
    let id = localStorage.getItem('mazePLayerId');
    if(!id){
        id = crypto.randomUUID();
        localStorage.setItem('mazePlayerId', id)
    }
    return id;
}

async function request(path, options = {}){
    const res = await fetch(`${API_BASE}${path}`,{
        headers: {'Content-Type': 'application/json'},
        ...options
    })
    if(!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json;
}

export async function fetchProgress(){
    const playerId = getOrCreatePlayerId();
    return request(`/api/progress/${playerId}`);
}

export async function submitLevelResult(levelIndex,stars,moves,seconds){
    const playerId = getOrCreatePlayerId();
    return request(`/api/progress/${playerId}`,{
    method: 'POST',
    body: JSON.stringfy({levelIndex,stars, moves, seconds})
    }
    )
}

export async function submitEndlessDepth(depth){
    const playerId = getOrCreatePlayerId();
    return request(`/api/progress/${playerId}/endless`,{
    method: 'POST',
    body: JSON.stringfy({depth})
    }
    )
}

export async function fetchLeaderboard(){
    return request('/api/leaderboard');
}
