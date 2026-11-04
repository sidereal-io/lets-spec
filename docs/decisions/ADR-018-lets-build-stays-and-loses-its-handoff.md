---
id: adr-018
date: 2026-11-04
status: accepted
title: 'ADR-018: lets-build stays, trimmed of its handoff, and lets-go runs it across sessions'
description: Architecture decision record (ADR) for keeping lets-build as the skill for one session's work, removing its offer to build in a new session, and leaving lets-go to run the workflow across sessions
---

# ADR-018: lets-build stays, trimmed of its handoff, and lets-go runs it across sessions

> Builds on [ADR-016](ADR-016-review-and-handoff-stay-apart-from-step.md): that record kept the `handoff` strategy for one caller, and said it goes if that caller goes.
