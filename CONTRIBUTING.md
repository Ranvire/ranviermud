# Contributing to Ranvire

This project is a maintenance-focused fork of the Ranvier MUD engine. Contributions will probably be rejected. See below.

## Scope

Ranvire exists to keep Ranvier buildable and usable on modern systems with minimal impact on existing behavior and architecture.

Changes are generally limited to:
- Compatibility with current Node.js versions
- Tooling and dependency breakage
- CI failures
- Clear correctness issues

Feature development is not yet a goal of this fork.

## Feature requests

Feature requests are unlikely to be accepted.

They may be considered only if:
- They align with work the maintainer already intends to do
- They are minimal in scope
- They do not alter core architecture or gameplay behavior

Requests that amount to “wouldn’t it be nice if…” will usually be declined without extended discussion.

## Pull requests

If you submit a pull request:
- Keep changes as small and isolated as possible
- Do not refactor for style, readability, or modernity unless required for correctness
- Avoid bundling unrelated changes
- Be explicit about *why* the change is necessary
- Extra points: describe the issue to be corrected in a new issue, and
- Refer to this issue by # in the PR

A working build is required, but a green build alone is not sufficient. The reason for the change must be clear.

## Reviews and decisions

Review feedback may be brief.

Acceptance is based on:
- Necessity
- Correctness
- Minimal impact

Lack of acceptance does not imply that the change is bad, only that it does not fit the scope of this project.

## Audience

This project assumes contributors:
- Are comfortable reading and modifying unfamiliar code
- Do not require detailed guidance or mentoring
- Can evaluate tradeoffs independently

If you are looking for an active feature-driven community, this is probably not the right project.

---

This repository is maintained primarily for personal use and long-term viability.
