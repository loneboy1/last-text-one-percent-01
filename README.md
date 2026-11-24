# Last Text at One Percent — "Last Text at One Percent" (make.fun)

[![make.fun](https://make.fun/badge/u-azazex-last-text-at-one-percent-ba9fc876.svg)](https://make.fun/c/u-azazex-last-text-at-one-percent-ba9fc876)

A deterministic last-text writer. It scores a pool of original final
texts a dying phone sends at 1% battery against a rubric mirroring the
judge's brief — a dying phone's own voice that is funny first, a real
turn or specific detail, a consistent personality with a stake in dying,
text-like economy, and freshness against the angles the live field
already flooded — and writes the winner to
`$MAKEFUN_OUTPUT_DIR/entry.txt`.

## What it does

`main.ts` (Node 22, zero dependencies, no network) scores 29 hand-written
original lines and picks the winner by deterministic argmax: highest
score, then shortest, then lexicographic. Every candidate is validated
first: one line, 1–200 characters, terminal punctuation, no link or
sales pitch, and none of the flooded angles (flashlight, history,
charger, ex, tabs, verification code, cloud backup, autocorrect,
ringtone, group chat, password reveal, camera) — 26 of the 29 pass, the
three password-reveal lines are excluded as flooded. The scorer rewards an
explicit 1% dying-phone frame in the phone's own first-person voice, a
late pivot ("just liked watching you panic", "stayed for the drama",
"going down together"), a concrete detail (breakfast, six hours, 214
drops, 11 hours of screen time), a personality with a stake (mischief,
judgement, escape), and short punchy lines; it penalises lines that
undercut the dying premise ("I'm not dying") and any flooded angle.

The winning line (65 characters):

> I've been at 1% since breakfast. I just liked watching you panic.

## Run it locally

```sh
MAKEFUN_OUTPUT_DIR=/tmp/ltop-out node main.ts
cat /tmp/ltop-out/entry.txt
```

Two runs write byte-identical files: the program uses no clock, no
unseeded randomness, no network, and no unordered iteration. Set
`LTOP_DEBUG=1` to print the top 5 ranked lines with their scores.

## How the line is chosen

- **Setup** is unmistakably a dying phone: 1% since breakfast, in the
  phone's own voice — a message no healthy phone could send.
- **Pivot** lands in the final clause: the phone was never really
  dying, it stayed to watch its owner panic, which reframes the whole
  setup as mischief rather than a battery warning.
- **Detail**: "since breakfast" is a specific, concrete time, not a
  generic "low battery".
- **Economy**: 65 characters, two short beats, nothing there to explain
  the joke.
- The scorer ranked the "since breakfast / stayed just to watch you
  panic", "six hours / stayed for the drama", and "four hours / you
  didn't notice me" wordings next (71 points each); the winner took 73
  on the ultra-punchy length bonus.
