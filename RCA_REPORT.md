# Root Cause Analysis (RCA) - BotOps Platform (Deep Dive)

## 1. Redundancy & Architectural Conflict
- **Issue**: Dual backend systems (Python FastAPI & Next.js API).
- **5 Whys**:
  1. *Why are there two backends?* Because the project was likely in the middle of a migration or built by different teams.
  2. *Why wasn't the migration completed?* Lack of unified architectural vision or time constraints.
  3. *Why does this matter?* It causes confusion, resource waste, and potential bugs in routing (Nginx).
  4. *Why is routing affected?* Nginx tries to proxy to a service that might not be the source of truth.
  5. *Root Cause*: Failure to enforce a single source of truth for the system's business logic.
- **Classification**: Architecture / Stability.

## 2. Authentication & Authorization Flaws
- **Issue**: Hardcoded credentials and unprotected API routes.
- **5 Whys**:
  1. *Why are credentials hardcoded?* Easier for initial development and testing.
  2. *Why weren't they moved to environment variables?* Negligence in following production-ready security practices.
  3. *Why are API routes unprotected?* Lack of a centralized middleware implementation.
  4. *Why was middleware missing?* The developer assumed the frontend was the only consumer.
  5. *Root Cause*: Absence of a "Security-First" development mindset and lack of automated security linting.
- **Classification**: Security.

## 3. Remote Code Execution (RCE) by Design
- **Issue**: Executing arbitrary code on the host without isolation.
- **5 Whys**:
  1. *Why is code executed directly?* Simplest way to implement a "Bot Runner".
  2. *Why is there no isolation?* Docker-in-Docker or VM isolation is complex to set up.
  3. *Why is this a critical risk?* One malicious script can take over the entire server.
  4. *Why wasn't this addressed?* The system was designed for a "trusted" single admin, ignoring the risk of account compromise.
  5. *Root Cause*: Prioritizing ease of implementation over fundamental system security (Sandboxing).
- **Classification**: Security / Risk Management.

## 4. Resource Management
- **Issue**: No limits on bot CPU/RAM usage.
- **5 Whys**:
  1. *Why are there no limits?* Default behavior of `spawn` is unrestricted.
  2. *Why wasn't monitoring implemented?* Complexity of tracking child process metrics in real-time.
  3. *Why is this a problem?* A single bot can DoS (Denial of Service) the entire platform.
  4. *Root Cause*: Lack of resource quotas and health monitoring in the process manager.
- **Classification**: Performance / Stability.
