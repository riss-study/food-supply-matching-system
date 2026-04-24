rootProject.name = "backend"

include(
    ":shared-core",
    ":api-server",
    ":admin-server",
    ":command-domain-user",
    ":command-domain-supplier",
    ":command-domain-request",
    ":command-domain-quote",
    ":command-domain-thread",
    ":command-domain-notice",
    ":command-domain-review"
)
