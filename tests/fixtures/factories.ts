export class QaFactory {
  private sequence = 0;
  constructor(readonly runId: string) {}
  id(kind: string) { this.sequence += 1; return `${this.runId}-${kind}-${String(this.sequence).padStart(4, "0")}`; }
  user(overrides = {}) { return { id: this.id("user"), email: `${this.id("email")}@qa.bcb.test`, name: `${this.runId} User`, ...overrides }; }
  meeting(overrides = {}) { return { id: this.id("meeting"), meetingCode: this.id("MTG"), title: `${this.runId} Meeting`, ...overrides }; }
  participant(overrides = {}) { return { id: this.id("participant"), status: "PENDING", ...overrides }; }
  agendaItem(overrides = {}) { return { id: this.id("agenda"), title: `${this.runId} Agenda`, status: "DRAFT", ...overrides }; }
  agendaDocument(overrides = {}) { return { id: this.id("agenda-document"), ...overrides }; }
  boardPack(overrides = {}) { return { id: this.id("board-pack"), packCode: this.id("PACK"), status: "DRAFT", ...overrides }; }
  memo(overrides = {}) { return { id: this.id("memo"), memoId: this.id("MEMO"), title: `${this.runId} Memo`, ...overrides }; }
  minutes(overrides = {}) { return { id: this.id("minutes"), minutesCode: this.id("MIN"), status: "DRAFT", ...overrides }; }
  resolution(overrides = {}) { return { id: this.id("resolution"), resolutionNumber: this.id("RES"), ...overrides }; }
  actionItem(overrides = {}) { return { id: this.id("action"), title: `${this.runId} Action`, status: "OPEN", ...overrides }; }
  notification(overrides = {}) { return { id: this.id("notification"), type: "QA", title: `${this.runId} Notification`, ...overrides }; }
  documentGrant(overrides = {}) { return { id: this.id("grant"), ...overrides }; }
  viewerSession(overrides = {}) { return { id: this.id("viewer"), publicTraceId: this.id("trace"), ...overrides }; }
  archiveRecord(overrides = {}) { return { id: this.id("archive"), archiveCode: this.id("ARCH"), title: `${this.runId} Archive`, ...overrides }; }
}
