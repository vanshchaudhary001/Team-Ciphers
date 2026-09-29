# START SMART — 2-Minute Hackathon Judge Demo Guide

This step-by-step presentation script is optimized to demonstrate the technical superiority of Start Smart within a crisp 2-minute judge interaction.

---

## 🎬 Demo Workflow Timeline (0:00 – 2:00)

### 0:00 – 0:20 · The Problem Statement (Landing Page)
1. Open **[http://localhost:3000](http://localhost:3000)** in the browser.
2. **What to say**:
   > *"Judges, when new hires join high-growth companies, their first week is a maze. Traditional onboarding tools show you what is pending, like 'GitHub access is pending'. But they never tell you **why** it's blocked, **who** holds the key, **how many** downstream tasks are delayed, or **what** useful work you can complete right now. Start Smart solves this through dependency-aware orchestration."*
3. Point out the visual comparison on the page:
   - *Traditional*: "GitHub access is pending."
   - *Start Smart*: "GitHub access is waiting for VPN approval from IT Operations. 4 downstream tasks are affected. Complete security training while you wait."

---

### 0:20 – 0:45 · Aarav's Blocked State & SideQuests (My Start)
1. Click **"Aarav Sharma"** in the top **Judge Persona Switcher** bar (or click "Explore Live Demo as Aarav").
2. **What to say**:
   > *"Here is Aarav Sharma, a new Software Engineer on Day 2. Look at his dashboard: his Journey Health is **DETOURING**. Notice that his Laptop is DONE, but VPN Approval is WAITING with IT Operations, leaving GitHub Access, Repo Access, Dev Environment, and his First Coding PR completely **LOCKED**."*
3. Highlight the **SideQuest™** cards:
   > *"Instead of sitting idle, Start Smart's recommendation engine calculates tasks with satisfied prerequisites that have **zero dependency** on the VPN blocker: Security Awareness and Orientation are available now!"*

---

### 0:45 – 1:10 · The UNSTICK™ Engine in Action
1. Click the glowing **"I'M STUCK (UNSTICK)"** button on Aarav's dashboard.
2. In the modal, leave the query *"I can't access GitHub"* and click **"Diagnose"**.
3. **What to say**:
   > *"When Aarav asks why he can't access GitHub, our engine traverses the dependency graph upstream. It discovers that GitHub Access isn't the problem—the root bottleneck is **VPN Approval with IT Operations**, waiting for 8 hours. It calculates that 4 downstream tasks are stalled."*
4. Click **"Nudge Responsible Owner"**:
   - Show the green confirmation: *"Nudge sent to IT Operations! Notification logged."*

---

### 1:10 – 1:35 · RippleView™ & HR Control Center
1. Click **"Priya Sharma (HR Admin)"** in the top switcher bar.
2. Show the **Active Blockers Table**:
   > *"HR has total visibility. They see Aarav's VPN blocker, Riya's laptop delivery delay, and Kabir's documentation gate, along with SLA breach indicators."*
3. Click **"Global RippleView™"** in the header or navbar:
   > *"Here is RippleView™—an interactive DAG visualization powered by React Flow. You can clearly see the pulsing amber node indicating the active root blocker and the cascading locked chain below it."*

---

### 1:35 – 2:00 · The Live Unlock Differentiator (The "WOW" Moment)
1. Click **"Vikram IT (IT Task Owner)"** in the top switcher bar to open **My Actions**.
2. Point out the pending action:
   - *VPN Certificate & Access Approval for Aarav Sharma · Blocks 4 Downstream Tasks*.
3. Click the green button: **"Approve & Unlock Dependencies"**.
   - Accept the browser confirmation.
4. Immediately click **"Aarav Sharma (Employee)"** in the top switcher bar.
5. **The Punchline**:
   > *"Now watch Aarav's dashboard in real time: VPN is marked DONE, the blocker alert vanishes, and **GitHub Enterprise Organization Access has dynamically UNLOCKED to AVAILABLE!** Aarav is unblocked, ready to contribute, and the entire downstream pipeline is back on track."*

---

## 🔄 Instant Demo Reset Command
If judges ask to see the demo again or test different roles, click the red **"Reset Demo"** button on the top toolbar or run:

```bash
cd server
npm run seed
```
This resets the database idempotently back to the initial scenario where Aarav is blocked on VPN and 4 downstream tasks are locked!
