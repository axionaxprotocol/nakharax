# nakhara Repository Connection Flow

## Connection Diagram

```mermaid
graph TD
    nakhara_core["✅ nakhara-core"]
    nakhara_web["✅ nakhara-web"]
    nakhara_sdk_ts["✅ nakhara-sdk-ts"]
    nakhara_marketplace["✅ nakhara-marketplace"]
    nakhara_docs["✅ nakhara-docs"]
    nakhara_deploy["✅ nakhara-deploy"]
    nakhara_devtools["✅ nakhara-devtools"]
    nakhara_core -->|docs:reference(4)| nakhara_web
    nakhara_core -->|docs:reference(9)| nakhara_sdk_ts
    nakhara_core -->|docs:reference(4)| nakhara_marketplace
    nakhara_core -->|docs:reference(6)| nakhara_docs
    nakhara_core -->|docs:reference(4)| nakhara_deploy
    nakhara_core -->|docs:reference(4)| nakhara_devtools
    nakhara_web -->|docs:reference(7)| nakhara_core
    nakhara_web -->|docs:reference(7)| nakhara_sdk_ts
    nakhara_web -->|docs:reference(4)| nakhara_marketplace
    nakhara_web -->|docs:reference(7)| nakhara_docs
    nakhara_web -->|docs:reference(8)| nakhara_deploy
    nakhara_web -->|docs:reference(4)| nakhara_devtools
    nakhara_sdk_ts -->|docs:reference(4)| nakhara_core
    nakhara_sdk_ts -->|docs:reference(1)| nakhara_web
    nakhara_sdk_ts -->|docs:reference(1)| nakhara_marketplace
    nakhara_marketplace -->|docs:reference(4)| nakhara_core
    nakhara_marketplace -->|docs:reference(2)| nakhara_docs
    nakhara_docs -->|docs:reference(11)| nakhara_core
    nakhara_docs -->|docs:reference(5)| nakhara_web
    nakhara_docs -->|docs:reference(4)| nakhara_sdk_ts
    nakhara_docs -->|docs:reference(4)| nakhara_marketplace
    nakhara_docs -->|docs:reference(5)| nakhara_deploy
    nakhara_docs -->|docs:reference(4)| nakhara_devtools
    nakhara_deploy -->|docs:reference(8)| nakhara_core
    nakhara_deploy -->|docs:reference(5)| nakhara_web
    nakhara_deploy -->|docs:reference(3)| nakhara_sdk_ts
    nakhara_deploy -->|docs:reference(2)| nakhara_marketplace
    nakhara_deploy -->|docs:reference(5)| nakhara_docs
    nakhara_deploy -->|docs:reference(2)| nakhara_devtools
    nakhara_devtools -->|docs:reference(4)| nakhara_core
    nakhara_devtools -->|docs:reference(4)| nakhara_web
    nakhara_devtools -->|docs:reference(4)| nakhara_sdk_ts
    nakhara_devtools -->|docs:reference(2)| nakhara_marketplace
    nakhara_devtools -->|docs:reference(2)| nakhara_docs
    nakhara_devtools -->|docs:reference(2)| nakhara_deploy

    classDef coreStyle fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    classDef webStyle fill:#4ecdc4,stroke:#219a91,stroke-width:2px
    classDef toolStyle fill:#ffe66d,stroke:#cca300,stroke-width:2px
    classDef sdkStyle fill:#a8e6cf,stroke:#64b58b,stroke-width:2px

    class nakhara_core coreStyle
    class nakhara_web,nakhara_marketplace webStyle
    class nakhara_devtools,nakhara_deploy toolStyle
    class nakhara_sdk_ts,nakhara_docs sdkStyle
```

## Legend

- 🔴 **Core**: nakhara-core (main protocol implementation)
- 🔵 **Web**: nakhara-web, nakhara-marketplace (web interfaces)
- 🟡 **Tools**: nakhara-devtools, nakhara-deploy (development & deployment)
- 🟢 **SDK/Docs**: nakhara-sdk-ts, nakhara-docs (libraries & documentation)
