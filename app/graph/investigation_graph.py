from langgraph.graph import StateGraph, START, END

from app.graph.state import InvestigationState

from app.graph.nodes import (
    build_context_node,
    discover_resources_node,
    update_service_node,
    collect_evidence_node,
    analyze_logs_node,
    verify_knowledge_node,
    build_summary_node,
    correlation_node,
    evidence_node,
    recommendations_node,
    executive_summary_node,
    investigation_result_node,
    impact_node,
    database_impact_node,
    ai_reasoner_node,
    timeline_node,
    report_node,
    servicenow_update_node,
)


def build_investigation_graph():

    graph = StateGraph(InvestigationState)

    # --------------------------------------------------------
    # Nodes
    # --------------------------------------------------------

    graph.add_node(
        "build_context",
        build_context_node,
    )

    graph.add_node(
        "discover_resources",
        discover_resources_node,
    )

    graph.add_node(
        "update_service",
        update_service_node,
    )

    graph.add_node(
        "collect_evidence",
        collect_evidence_node,
    )

    graph.add_node(
        "analyze_logs",
        analyze_logs_node,
    )

    graph.add_node(
        "verify_knowledge",
        verify_knowledge_node,
    )

    graph.add_node(
        "build_summary",
        build_summary_node,
    )

    graph.add_node(
        "correlation",
        correlation_node,
    )

    graph.add_node(
        "evidence",
        evidence_node,
    )

    graph.add_node(
        "recommendations",
        recommendations_node,
    )

    graph.add_node(
        "executive_summary",
        executive_summary_node,
    )

    graph.add_node(
        "investigation_result",
        investigation_result_node,
    )

    graph.add_node(
        "impact",
        impact_node,
    )

    graph.add_node(
        "database_impact",
        database_impact_node,
    )

    graph.add_node(
        "ai_reasoner",
        ai_reasoner_node,
    )

    graph.add_node(
        "timeline",
        timeline_node,
    )

    graph.add_node(
        "report",
        report_node,
    )

    graph.add_node(
        "servicenow_update",
        servicenow_update_node,
    )

    # --------------------------------------------------------
    # Edges
    # --------------------------------------------------------

    graph.add_edge(
        START,
        "build_context",
    )

    graph.add_edge(
        "build_context",
        "discover_resources",
    )

    graph.add_edge(
        "discover_resources",
        "update_service",
    )

    graph.add_edge(
        "update_service",
        "collect_evidence",
    )

    graph.add_edge(
        "collect_evidence",
        "analyze_logs",
    )

    graph.add_edge(
        "analyze_logs",
        "verify_knowledge",
    )

    graph.add_edge(
        "verify_knowledge",
        "build_summary",
    )

    graph.add_edge(
        "build_summary",
        "correlation",
    )

    graph.add_edge(
        "correlation",
        "evidence",
    )

    graph.add_edge(
        "evidence",
        "recommendations",
    )

    graph.add_edge(
        "recommendations",
        "executive_summary",
    )

    graph.add_edge(
        "executive_summary",
        "investigation_result",
    )

    graph.add_edge(
        "investigation_result",
        "impact",
    )

    graph.add_edge(
        "impact",
        "database_impact",
    )

    graph.add_edge(
        "database_impact",
        "ai_reasoner",
    )

    graph.add_edge(
        "ai_reasoner",
        "timeline",
    )

    graph.add_edge(
        "timeline",
        "report",
    )

    graph.add_edge(
        "report",
        "servicenow_update",
    )

    graph.add_edge(
        "servicenow_update",
        END,
    )

    return graph.compile()