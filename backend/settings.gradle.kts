rootProject.name = "backend"

include(
    ":shared-core",
    ":projection",
    ":api-server",
    ":admin-server",
    ":command-domain-user",
    ":command-domain-supplier",
    ":command-domain-request",
    ":command-domain-quote",
    ":command-domain-thread",
    ":command-domain-notice",
    ":query-model-user",
    ":query-model-supplier",
    ":query-model-request",
    ":query-model-quote",
    ":query-model-thread",
    ":query-model-admin-review",
    ":query-model-admin-stats"
)
