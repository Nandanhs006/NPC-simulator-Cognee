"""
graph.py — D3 Graph Data API Router

Exposes the /api/v1/graph/data endpoint which returns contracted,
storytelling-ready graph data for the frontend D3 visualization.
"""

from fastapi import APIRouter
from services.graph_service import compile_graph_data

router = APIRouter()


@router.get("/api/v1/graph/data")
async def get_graph_data_endpoint():
    """Return the compiled knowledge graph with contracted event nodes."""
    return await compile_graph_data()
