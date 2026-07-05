import re

def parse_retrieved_memories(recalled_text: str, current_day: int = 1) -> list:
    parsed_memories = []
    if not recalled_text:
        return parsed_memories
        
    lines = recalled_text.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        meta_match = re.search(r"^\[Metadata\](.*?)\[Memory\](.*)$", line)
        if meta_match:
            meta_str = meta_match.group(1).strip()
            memory_text = meta_match.group(2).strip()
            
            metadata = {}
            pairs = meta_str.split("|")
            for pair in pairs:
                if ":" in pair:
                    k, v = pair.split(":", 1)
                    metadata[k.strip().lower()] = v.strip()
            
            imp = metadata.get("importance", "Low").capitalize()
            if imp == "Critical":
                imp_weight = 4
            elif imp == "High":
                imp_weight = 3
            elif imp == "Medium":
                imp_weight = 2
            else:
                imp_weight = 1

            confidence_str = metadata.get("confidence", "100").replace("%", "")
            try:
                confidence = int(confidence_str)
            except ValueError:
                confidence = 100

            parsed_memories.append({
                "text": memory_text,
                "importance": imp,
                "imp_weight": imp_weight,
                "confidence": confidence,
                "category": metadata.get("category", "Conversation"),
                "visibility": metadata.get("visibility", "Private"),
                "source": metadata.get("source", "System"),
                "target": metadata.get("target", "Player"),
                "timestamp": metadata.get("timestamp", "")
            })
        else:
            parsed_memories.append({
                "text": line,
                "importance": "Low",
                "imp_weight": 1,
                "confidence": 100,
                "category": "Conversation",
                "visibility": "Private",
                "source": "System",
                "target": "Player",
                "timestamp": ""
            })
            
    # Apply dynamic confidence decay based on elapsed days
    for m in parsed_memories:
        timestamp = m.get("timestamp", "")
        day_match = re.search(r"Day\s*(\d+)", timestamp, re.IGNORECASE)
        memory_day = int(day_match.group(1)) if day_match else current_day
        
        # Day 0 relationships and rules are permanent core traits; do not decay them.
        if memory_day > 0:
            elapsed = max(0, current_day - memory_day)
            decay_factor = max(0.1, 1.0 - (elapsed * 0.061))
            m["confidence"] = round(m["confidence"] * decay_factor)

    # Decay Sorting: Prioritize Critical/High events, then by confidence
    parsed_memories.sort(key=lambda x: (x.get("imp_weight", 1), x.get("confidence", 100)), reverse=True)
    return parsed_memories
