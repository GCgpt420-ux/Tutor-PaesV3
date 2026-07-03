from prometheus_client import Counter, Histogram

# Contador total de llamadas a LLM por proveedor y estado de respuesta
LLM_REQUESTS_TOTAL = Counter(
    "tutorpaes_llm_requests_total",
    "Cantidad total de solicitudes de inferencia a proveedores LLM",
    ["provider", "status"]
)

# Histograma de latencia para las respuestas del LLM
LLM_REQUEST_LATENCY = Histogram(
    "tutorpaes_llm_request_latency_seconds",
    "Latencia en segundos de llamadas completadas de proveedores LLM",
    ["provider"],
    buckets=(0.2, 0.5, 1.0, 2.0, 5.0, 10.0, float("inf"))
)

# Contador de errores de inferencia o red agrupados por proveedor y tipo de error
LLM_ERRORS_TOTAL = Counter(
    "tutorpaes_llm_errors_total",
    "Cantidad total de errores de red o inferencia en proveedores LLM",
    ["provider", "error_type"]
)
