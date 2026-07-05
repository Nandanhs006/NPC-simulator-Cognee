NPCS = [
    {"id": "sheriff", "name": "Sheriff Jeremiah Ashcroft", "role": "Sheriff", "desc": "The town Sheriff. Prioritizes official evidence, rules, and dry facts.", "avatar": "🤠"},
    {"id": "banker", "name": "Banker Victor Sterling", "role": "Banker", "desc": "The wealthy town banker. Cares about credit-worthiness and money. Dislikes Wade.", "avatar": "💼"},
    {"id": "doctor", "name": "Doctor Isaac Vance", "role": "Doctor", "desc": "The town doctor. Quiet, highly professional, respects patient privacy above all.", "avatar": "🩺"},
    {"id": "general_store", "name": "Ruth Hayes", "role": "Hayes General Store", "desc": "Friendly store owner. Believes saloon rumors easily, loves loyal customers.", "avatar": "🛒"},
    {"id": "ranch", "name": "Wade Granger", "role": "Creekwoods Ranch Owner", "desc": "Proud cattle rancher. Very emotional, slow to forgive crimes, dislikes Victor.", "avatar": "🌾"},
    {"id": "bartender", "name": "Bartender Buck", "role": "IronOak Saloon Bartender", "desc": "Friendly bartender. Spreads saloon gossip and hearsay connected to everyone.", "avatar": "🍺"}
]

ATTITUDE_STYLES = {
    "Hostile": {"bg": "bg-red-950/40", "color": "text-red-400", "border": "border-red-900/30", "label": "Hostile"},
    "Wary": {"bg": "bg-orange-950/20", "color": "text-orange-400", "border": "border-orange-900/20", "label": "Wary"},
    "Neutral": {"bg": "bg-slate-900/40", "color": "text-gray-400", "border": "border-gray-800/50", "label": "Neutral"},
    "Friendly": {"bg": "bg-emerald-950/20", "color": "text-emerald-400", "border": "border-emerald-900/20", "label": "Friendly"},
    "Allied": {"bg": "bg-amber-950/30", "color": "text-amber-400", "border": "border-amber-900/30", "label": "Allied & Trusted"},
}

ID_MAP = {
    "Victor_Sterling": "Banker Victor Sterling",
    "Jeremiah_Ashcroft": "Sheriff Jeremiah Ashcroft",
    "Isaac_Vance": "Doctor Isaac Vance",
    "Wade_Granger": "Ranch Owner Wade Granger",
    "Ruth_Hayes": "General Store Ruth Hayes",
    "Buck": "Bartender Buck",
    "Lalo": "Lalo",
    "Nacho": "Nacho"
}
