# Fase 7: Scheduled Jobs / Cron

**Objetivo:** Sistema de cron de Hermes accesible desde Nimbalyst.
**Esfuerzo:** 1 semana
**Dependencias:** Fase 1

---

## 📋 Descripción

Conectar el sistema de cron de Hermes (scheduled jobs) con Nimbalyst, permitiendo crear, gestionar y monitorear jobs programados.

---

## 🏗️ Arquitectura

```
Nimbalyst UI
    │
    ▼
CronBridge
    │
    ├── Hermes Cron System
    │   ├── Job creation
    │   ├── Job scheduling
    │   ├── Job execution
    │   └── Job monitoring
    │
    └── Hermes Process
        └── cronjob tool
```

---

## 🔧 Implementación

### 7.1 CronBridge

```typescript
export class CronBridge {
  private hermesProcess: HermesProcessManager;

  // Listar jobs
  async listJobs(): Promise<CronJob[]> {
    const result = await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'list'
    });
    return this.parseJobs(result);
  }

  // Crear job
  async createJob(options: CreateJobOptions): Promise<CronJob> {
    const result = await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'create',
      schedule: options.schedule,
      prompt: options.prompt,
      name: options.name,
      deliver: options.deliver,
      skills: options.skills
    });
    return this.parseJob(result);
  }

  // Actualizar job
  async updateJob(
    jobId: string,
    updates: UpdateJobOptions
  ): Promise<CronJob> {
    const result = await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'update',
      job_id: jobId,
      ...updates
    });
    return this.parseJob(result);
  }

  // Eliminar job
  async removeJob(jobId: string): Promise<void> {
    await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'remove',
      job_id: jobId
    });
  }

  // Pausar/reanudar job
  async pauseJob(jobId: string): Promise<void> {
    await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'pause',
      job_id: jobId
    });
  }

  async resumeJob(jobId: string): Promise<void> {
    await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'resume',
      job_id: jobId
    });
  }

  // Ejecutar job manualmente
  async runJob(jobId: string): Promise<void> {
    await this.hermesProcess.execute({
      tool: 'cronjob',
      action: 'run',
      job_id: jobId
    });
  }
}
```

### 7.2 Cron Panel UI

```typescript
export class CronPanel extends React.Component {
  render() {
    return (
      <div className="cron-panel">
        <CronJobList
          jobs={this.state.jobs}
          onSelect={this.handleJobSelect}
          onPause={this.handlePause}
          onResume={this.handleResume}
          onRun={this.handleRun}
          onRemove={this.handleRemove}
        />
        <CronJobDetail
          job={this.state.selectedJob}
          onEdit={this.handleEdit}
        />
        <CronJobCreate
          onCreate={this.handleCreate}
        />
        <CronJobHistory
          jobId={this.state.selectedJob?.id}
          history={this.state.history}
        />
      </div>
    );
  }
}
```

### 7.3 Job Types

| Tipo | Ejemplo | Uso |
|------|---------|-----|
| **Interval** | `30m`, `2h` | Cada X tiempo |
| **Cron** | `0 9 * * *` | Horario específico |
| **One-shot** | `2026-08-17T09:00:00` | Una vez |
| **Monitor** | `monitor_url`, `monitor_script` | Watchdog |

### 7.4 Job Features

| Feature | Descripción |
|---------|-------------|
| **Schedule** | Cron expression, interval, or ISO timestamp |
| **Prompt** | Self-contained prompt for the agent |
| **Skills** | Skills to load before execution |
| **Deliver** | Delivery target (origin, local, all, platform:chat_id) |
| **Script** | Script to run each tick |
| **Monitor** | Monitor mode (hash-suppression) |
| **No Agent** | Script-only mode (no LLM) |
| **Workdir** | Working directory for the job |
| **Repeat** | Repeat count (default: forever for recurring) |

---

## 📊 Job Templates

### Daily Report
```yaml
schedule: "0 9 * * *"
prompt: "Generate a daily report of project status"
skills: ["knowledge-management"]
deliver: "origin"
```

### Health Check
```yaml
schedule: "*/5 * * * *"
script: "~/.hermes/scripts/health-check.sh"
no_agent: true
monitor_script: true
```

### Weekly Summary
```yaml
schedule: "0 17 * * 5"
prompt: "Summarize this week's work and plan next week"
skills: ["weekly-review-planning"]
deliver: "origin"
```

---

## ✅ Criterios de Aceptación

- [ ] CronBridge conecta a Hermes cron system
- [ ] Se pueden listar jobs
- [ ] Se pueden crear jobs
- [ ] Se pueden pausar/reanudar jobs
- [ ] Se pueden ejecutar jobs manualmente
- [ ] Se pueden eliminar jobs
- [ ] Panel cron funcional
- [ ] Job history visible
