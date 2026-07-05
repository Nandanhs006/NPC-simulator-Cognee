"""
memory_parser.py — Recall Result Formatter

Converts raw Cognee recall result objects into clean text strings
suitable for LLM context injection.
"""


def format_recall_results(results) -> str:
    """Format a list of Cognee recall result objects into a newline-separated string."""
    if not results:
        return ""
    formatted = []
    for item in results:
        source = getattr(item, "source", None)
        if source == "graph" and hasattr(item, "text"):
            formatted.append(item.text)
        elif source == "graph_context" and hasattr(item, "content"):
            formatted.append(item.content)
        elif source == "session_context" and hasattr(item, "content"):
            formatted.append(item.content)
        elif source == "session" and hasattr(item, "answer"):
            formatted.append(f"Q: {getattr(item, 'question', '')} A: {item.answer}")
        elif hasattr(item, "text"):
            formatted.append(item.text)
        elif hasattr(item, "content"):
            formatted.append(item.content)
        else:
            formatted.append(str(item))
    return "\n".join(formatted)
