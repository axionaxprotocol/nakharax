# nakharax Repository Connection Flow

## Connection Diagram

```mermaid
graph TD
    nakharax_core["✅ nakharax-core"]
    nakharax_web["✅ nakharax-web"]
    nakharax_sdk_ts["✅ nakharax-sdk-ts"]
    nakharax_marketplace["✅ nakharax-marketplace"]
    nakharax_docs["✅ nakharax-docs"]
    nakharax_deploy["✅ nakharax-deploy"]
    nakharax_devtools["✅ nakharax-devtools"]
    nakharax_core -->|docs:reference(4)| nakharax_web
    nakharax_core -->|docs:reference(9)| nakharax_sdk_ts
    nakharax_core -->|docs:reference(4)| nakharax_marketplace
    nakharax_core -->|docs:reference(6)| nakharax_docs
    nakharax_core -->|docs:reference(4)| nakharax_deploy
    nakharax_core -->|docs:reference(4)| nakharax_devtools
    nakharax_web -->|docs:reference(7)| nakharax_core
    nakharax_web -->|docs:reference(7)| nakharax_sdk_ts
    nakharax_web -->|docs:reference(4)| nakharax_marketplace
    nakharax_web -->|docs:reference(7)| nakharax_docs
    nakharax_web -->|docs:reference(8)| nakharax_deploy
    nakharax_web -->|docs:reference(4)| nakharax_devtools
    nakharax_sdk_ts -->|docs:reference(4)| nakharax_core
    nakharax_sdk_ts -->|docs:reference(1)| nakharax_web
    nakharax_sdk_ts -->|docs:reference(1)| nakharax_marketplace
    nakharax_marketplace -->|docs:reference(4)| nakharax_core
    nakharax_marketplace -->|docs:reference(2)| nakharax_docs
    nakharax_docs -->|docs:reference(11)| nakharax_core
    nakharax_docs -->|docs:reference(5)| nakharax_web
    nakharax_docs -->|docs:reference(4)| nakharax_sdk_ts
    nakharax_docs -->|docs:reference(4)| nakharax_marketplace
    nakharax_docs -->|docs:reference(5)| nakharax_deploy
    nakharax_docs -->|docs:reference(4)| nakharax_devtools
    nakharax_deploy -->|docs:reference(8)| nakharax_core
    nakharax_deploy -->|docs:reference(5)| nakharax_web
    nakharax_deploy -->|docs:reference(3)| nakharax_sdk_ts
    nakharax_deploy -->|docs:reference(2)| nakharax_marketplace
    nakharax_deploy -->|docs:reference(5)| nakharax_docs
    nakharax_deploy -->|docs:reference(2)| nakharax_devtools
    nakharax_devtools -->|docs:reference(4)| nakharax_core
    nakharax_devtools -->|docs:reference(4)| nakharax_web
    nakharax_devtools -->|docs:reference(4)| nakharax_sdk_ts
    nakharax_devtools -->|docs:reference(2)| nakharax_marketplace
    nakharax_devtools -->|docs:reference(2)| nakharax_docs
    nakharax_devtools -->|docs:reference(2)| nakharax_deploy

    classDef coreStyle fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    classDef webStyle fill:#4ecdc4,stroke:#219a91,stroke-width:2px
    classDef toolStyle fill:#ffe66d,stroke:#cca300,stroke-width:2px
    classDef sdkStyle fill:#a8e6cf,stroke:#64b58b,stroke-width:2px

    class nakharax_core coreStyle
    class nakharax_web,nakharax_marketplace webStyle
    class nakharax_devtools,nakharax_deploy toolStyle
    class nakharax_sdk_ts,nakharax_docs sdkStyle
```

## Legend

- 🔴 **Core**: nakharax-core (main protocol implementation)
- 🔵 **Web**: nakharax-web, nakharax-marketplace (web interfaces)
- 🟡 **Tools**: nakharax-devtools, nakharax-deploy (development & deployment)
- 🟢 **SDK/Docs**: nakharax-sdk-ts, nakharax-docs (libraries & documentation)
