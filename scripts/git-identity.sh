#!/usr/bin/env bash
# Commit as B, unsigned, with no AI trailers. Cloud containers default to a
# Claude identity and signing key; the SessionStart hook runs this.
cd "$(dirname "$0")/.." || exit 0
git config user.name "Basel"
git config user.email "baselsamy1999@gmail.com"
git config commit.gpgsign false
git config tag.gpgsign false
git config core.hooksPath .githooks
