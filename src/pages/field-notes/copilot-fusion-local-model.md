---
layout: ../../layouts/FieldNoteLayout.astro
title: "Field note: Can Copilot Fusion use my own local model?"
date: 2026-11-20
tags: [github-copilot, copilot-fusion, local-llm, ollama, foundry-local, apple-silicon]
---

# Field note: Can Copilot Fusion use my own local model?

*November 2026. Tested with Copilot CLI 1.0.109 and Ollama 0.40.16 on an Apple Silicon Mac; also checked the GitHub Copilot app and VS Code 1.147.*

**Short answer:** not today. Fusion only routes to local models that GitHub has approved. One of them needs more memory than most Macs have, and the other is only distributed for Windows. Any other local model works with Copilot, but only when you select it yourself.

## What I wanted

[Copilot Fusion](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)'s advantage is that you choose an effort level rather than a specific model: it routes each prompt to a suitable model and execution pattern, then returns one final response. For straightforward tasks it can use a single model; for tasks that warrant more scrutiny, it can use a cascade (a model drafts and a judge accepts or escalates) or a critique pattern (models critique in parallel and their feedback is aggregated for a revision). Fusion chooses a pattern for each prompt, so a conversation can mix them, and it adds model calls only when the task warrants them—balancing quality, latency, and cost against the selected effort level.

Two pieces sparked the idea: Ravi Verma’s [LinkedIn post about GitHub Copilot running AI models locally](https://www.linkedin.com/posts/ravi-verma-csa_github-copilot-can-now-run-ai-models-locally-share-7525979445023805441-vlH8/) and Microsoft Foundry’s article on [bringing agentic coding on-device with Foundry Local](https://devblogs.microsoft.com/foundry/foundry-local-agentic-coding-qwen3-8-27b/).

I wanted Fusion to have one more option: **a model running on my own Mac**, on my own network, ideally served by Microsoft's Foundry Local. Fusion would send small, routine steps to that model for free and privately, and keep the cloud models for the hard parts.

## What I found

### 1. Foundry Local didn't get off the ground on the Mac

Foundry Local was the plan, but it stalled at three points:

- **Installing:** on the day I tested, the Homebrew install failed because Microsoft's `microsoft/Foundry-Local` GitHub repository returned 404. The Python SDK ([`foundry-local-sdk`](https://pypi.org/project/foundry-local-sdk/) 2.5.0) is still published with a macOS build, but I didn't get to test it.
- **Sharing on my network:** the [Foundry Local CLI](https://learn.microsoft.com/azure/foundry-local/reference/reference-cli) lets you set the server's port, but documents no way to make it listen on the network. Other machines would need an SSH tunnel or a reverse proxy to reach it.
- **The coding model:** the agentic-coding model from Microsoft's article (Qwen3.8-27B) targets Windows PCs with NVIDIA GPUs. The article lists Mac support as future work.

So I switched to Ollama for the rest of the experiment.

### 2. Ollama gave me a working local model in minutes

In about ten minutes I had `qwen3.5:4b-mlx` running: 4 GB, with tool calling, on Apple's MLX engine. One fix was needed. Ollama's default context of 4,096 tokens is far too small for Copilot's prompts, so I created a copy of the model with `PARAMETER num_ctx 32768`.

In Copilot CLI, a real agent task (read a file, fix a bug, write it back) ran entirely on the Mac and was correct. The [Copilot app](https://docs.github.com/en/copilot/how-tos/github-copilot-app/use-byok-models) connected to the same Ollama model as well. In both, I had to select the model myself.

### 3. Fusion sees the local model but doesn't pick it

Next was the real question: would Fusion use it? I turned on experimental mode in Copilot CLI, added the Ollama model, and chose **Copilot Fusion → Standard**. Copilot asked Ollama for the model's details, then sent a small task to **GPT-6 Luna** in the cloud. The local model got no work.

GitHub's [changelog](https://github.blog/changelog/2026-10-28-github-copilot-fusion-now-supports-selection-of-local-models/) explains why: *"Adding or discovering a model through bring your own key (BYOK) configuration doesn't automatically make it eligible for Copilot Fusion."* Fusion only routes to two approved local models, MAI Code 1.1 Flash and Qwen3.8 Flash Next. Neither is small.

Non-interactive runs are stricter still. With a custom provider loaded, `copilot -p … --model auto` fails with *"No supported model available"*. So I keep the [local provider](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models) in a separate file and load it only when I want the local model:

```bash
COPILOT_PROVIDERS_CONFIG=~/.copilot/providers.local.json \
  copilot --model ollama/qwen3.5-4b-copilot
```

### 4. A workaround that wasn't worth it

If Fusion won't hand work to the local model, perhaps a subagent can. I kept a cloud model (Claude Sonnet 5.5) as the main agent and pointed Copilot's built-in `explore` subagent at the local model. It ran, but the 4B model put a function in the wrong file and invented one that doesn't exist. The task took about two and a half minutes, and the cloud model still used about 8 AI credits.

### 5. So it comes down to memory: 64 GB vs 128 GB

That leaves running one of the approved models myself. On Apple Silicon, macOS gives the GPU roughly **67–78% of unified memory** by default ([analysis](https://talkaiwith.substack.com/p/the-arithmetic-behind-picking-a-macbook)). You can raise the limit with `sudo sysctl iogpu.wired_limit_mb=…`.

| | 64 GB Mac | 128 GB Mac |
|---|---|---|
| GPU memory by default | ~43–50 GB | ~86–100 GB |
| Qwen3.8 Flash Next for Fusion ([official Ollama build](https://ollama.com/library/qwen3.8-flash-next/tags), 105 GB) | ❌ Doesn't fit | ⚠️ Possible in preview, with the GPU limit raised to about 115 GB and a modest context window. Tight. |
| Strong models you select yourself ([Qwen3.6](https://ollama.com/library/qwen3.6/tags) 35B MoE ~23 GB, [Qwen3.8](https://ollama.com/library/qwen3.8/tags) 27B ~18 GB, both with tool calling) | ✅ Comfortable, with room for 64k+ context | ✅ Comfortable, and several can be loaded at once |

A [1-bit community build](https://openclawdc.com/blog/can-i-run-qwen-3-8-flash-next-128gb-ram/) of Qwen3.8 Flash Next is smaller (~68 GiB), but it loses noticeable quality, and GitHub doesn't say whether Copilot would recognize it as the approved model.

The other approved model, MAI Code 1.1 Flash, needs 53 GB for its on-device weights. That would fit a 128 GB Mac more easily. But Copilot's managed download for it is Windows-only. The coverage of Microsoft's announcement ([AICoder](https://aicoder.com/news/news-20261008-microsoft-mai-code-1-1-flash-local-copilot-hydrafusion), [ExplainX](https://www.explainx.ai/blog/mai-code-1-1-flash-local-windows-github-copilot-137b-surface-laptop-ultra-2026)) describes only Windows PCs with NVIDIA RTX Spark, and I found no public weights or Mac build.

**64 GB is plenty for a capable local coding model you select yourself, but not enough for Fusion to use one. At 128 GB, Fusion's local preview becomes possible, but only just.**

## Where I landed

My original idea, Fusion handing small steps to a model on my own Mac, isn't possible yet. Here's what I'm doing instead:

- **Fusion stays my default** in the Copilot app, the CLI and VS Code. For small tasks it already picks a cheap cloud model.
- **A local Ollama model is a separate option I select myself** for offline or private work. On a 64 GB machine that means a 27–35B model rather than a 4B one.
- **I'll check Fusion's list of local models again.** GitHub's [Fusion docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion) say the model pool "changes as new models become available". A smaller approved local model, or eligibility for models you bring yourself, is what would make my original idea work.

## What you should know

If you want to try this yourself, these are the requirements, the performance numbers people have reported so far, and the limitations to expect.

### Requirements (November 2026)

You can't add just any model of your own to Fusion. **Fusion only uses local models GitHub has approved, and right now there are two, each with heavy hardware requirements.** Everything else can only be selected by hand.

#### The two approved local models

| | MAI Code 1.1 Flash | Qwen3.8 Flash Next |
|---|---|---|
| Installed by Copilot (managed download) | Windows only (the [changelog](https://github.blog/changelog/2026-10-28-github-copilot-fusion-now-supports-selection-of-local-models/): *"The managed download experience is Windows-only"*; it installs as a managed Windows ML model): NVIDIA GPU (not AMD), at least 96 GB of combined RAM, 60 GB of disk ([CLI docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-llm-models)) | Not available |
| Set up yourself (Copilot CLI, any OS) | Through a local OpenAI-compatible server ([changelog](https://github.blog/changelog/2026-10-28-github-copilot-fusion-now-supports-selection-of-local-models/)). GitHub doesn't say where to get the weights. | Through Ollama (or another local OpenAI-compatible server), where Copilot must recognize it as `qwen3.8-flash-next-local` ([Fusion docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)). The official Ollama build is 105 GB or more. |
| Where Fusion can use it | CLI, Copilot app and VS Code (managed download); CLI (own setup) | Copilot CLI ([Fusion docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)) |

#### Requirements for both

- **Fusion Standard only.** Fusion High and Max don't use local models ([Fusion docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)).
- **Experimental mode on.**
  - **CLI:** start with `--experimental` or run `/experimental on` ([CLI docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-llm-models)).
  - **Copilot app:** Settings → Experiments → *Local model auto routing*. Its automatic routing currently covers managed Windows ML models only ([changelog](https://github.blog/changelog/2026-10-28-github-copilot-fusion-now-supports-selection-of-local-models/)).
  - **VS Code:** `chat.copilot.localModel.enabled` and `chat.copilot.localModel.useInAuto` (shown as "Use in Copilot Fusion"). Both are off by default. According to the setting's own description in VS Code 1.147, VS Code only offers on-device models at all on GPUs with about 64 GB of memory or more. That's a separate, lower bar than the 96 GB of combined RAM GitHub requires for the MAI Code download.
- **A local server.** Copilot only discovers Ollama on its own machine (`127.0.0.1`, or a local `OLLAMA_HOST`; [CLI docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-llm-models)). GitHub doesn't say whether a manually configured server elsewhere on your network counts.
- **A GitHub sign-in and a Copilot plan.** Fusion Standard is included on every plan ([Fusion docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)). Routing decisions still happen in the cloud, so local routing doesn't mean offline ([changelog](https://github.blog/changelog/2026-10-28-github-copilot-fusion-now-supports-selection-of-local-models/)).
- **Fusion decides when to use it.** It uses the local model when it judges it appropriate, with a fallback to cloud models (as VS Code's setting describes it). You can't force it from within Fusion.
- **It's a preview.** The approved list and these rules can change. GitHub's own pages don't fully agree: the [Fusion docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion) name Qwen3.8 Flash Next for the CLI, while the [CLI docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-llm-models) mention only MAI Code 1.1 Flash for Fusion Standard.

#### Not eligible (select by hand only)

- Any model other than the two approved ones, whichever server runs it: Ollama, Foundry Local, LM Studio, vLLM or any other OpenAI-compatible server.
- In my test, Fusion looked up my `qwen3.5-4b-copilot` model and then picked GPT-6 Luna.

### Performance: what people report

I found no published first-hand results for Fusion's local routing yet. What exists are numbers for the models on their own, plus one related experiment:

- **MAI Code 1.1 Flash:** Microsoft's own tests on a Surface Laptop Ultra with NVIDIA RTX Spark, reported by [AICoder](https://aicoder.com/news/news-20261008-microsoft-mai-code-1-1-flash-local-copilot-hydrafusion) and [ExplainX](https://www.explainx.ai/blog/mai-code-1-1-flash-local-windows-github-copilot-137b-surface-laptop-ultra-2026).
  - **Size:** 137B parameters (6.8B active), 53 GB of weights, and a 75.5 GB memory peak at 256k context.
  - **Prompt reading:** about 924 tok/s at 64k context and 770 tok/s at 128k.
  - **Quality:** SWE-bench Verified 70.8% on-device, versus 72.6% in the cloud.
- **Qwen3.8 Flash Next on a 128 GB M5 Max:** community and project reports ([llmcheck guide](https://llmcheck.net/guides/run-qwen-4-1-mac/), [llmcheck benchmarks](https://llmcheck.net/benchmarks), [MTPLX](https://www.mtplx.com/faq/)) give 47–62 tok/s generating and 1,155 tok/s reading a 4k prompt. [OpenClaw DC](https://openclawdc.com/blog/can-i-run-qwen-3-8-flash-next-128gb-ram/) reports slower results on other 128 GB machines, and the 1-bit build loses noticeable quality.
- **A cloud orchestrator with a local worker:** NAV measured its own tool, nav-pilot, in [`navikt/copilot` #1460](https://github.com/navikt/copilot/issues/1460), before Fusion's local routing shipped. (HydraFusion, in the issue's title, was Fusion's [research-preview name](https://aicybr.com/blog/github-hydrafusion-multi-model-copilot-routing).)
  - **Results:** quality held, but cloud cost was 0.83–2.10× and total time 2.7–3.6× the cloud-only run.
  - **NAV's conclusion:** the hybrid *"mostly costs more cloud credits and more time"* and is *"not a privacy boundary"*.
  - My `explore` subagent test pointed the same way.

**My estimate:**

- **Waiting for the first word:** Copilot sends 16–35k prompt tokens even for a one-word reply. At the prompt-reading speeds above, a local model needs roughly 15–45 seconds before it writes anything on a fresh request, and 15 is optimistic. Cloud models start in a few seconds.
- **Once it's running:** caching speeds up later steps, and 47–62 tok/s is fine for agent loops.
- **Savings:** unproven, because Fusion Standard already sends small tasks to cheap cloud models.
- **What you gain:** the local steps run on your own hardware, and you depend less on cloud capacity. Routing still happens in the cloud, though, so it isn't a privacy boundary.

### Current limitations

- **Fusion can't use a model you bring yourself.** It only routes to the two approved models, whichever server you use.
- **In scripts, a custom provider blocks Fusion.** In non-interactive runs (`-p`), a loaded custom provider makes `--model auto` fail entirely. Interactive sessions are unaffected.
- **No evidence yet that local routing saves time or credits.** By my rough estimate, local models need 15–45 seconds or more just to read Copilot's large prompts, and NAV found its measured cloud-plus-local hybrid slower and, in their words, mostly more expensive.
- **Local models don't provide inline code completions.** Semantic search and embeddings also need GitHub ([VS Code docs](https://code.visualstudio.com/docs/agent-customization/language-models)), and the Copilot cloud agent and Copilot code review always run on GitHub-hosted models (Copilot CLI's built-in help, `copilot help providers-local`).
- **Foundry Local couldn't be installed through Homebrew on macOS** at the time of writing (repository 404), and its coding model targets Windows PCs with NVIDIA GPUs.

## Sources

**What sparked it**

- [GitHub Copilot can now run AI models locally with Microsoft Foundry Local! — Ravi Verma on LinkedIn](https://www.linkedin.com/posts/ravi-verma-csa_github-copilot-can-now-run-ai-models-locally-share-7525979445023805441-vlH8/)
- [Bring Agentic Coding On-Device with Foundry Local — Microsoft Foundry Blog](https://devblogs.microsoft.com/foundry/foundry-local-agentic-coding-qwen3-8-27b/)

**GitHub and Microsoft**

- [About GitHub Copilot Fusion — GitHub Docs](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)
- [GitHub Copilot Fusion now supports selection of local models — GitHub Changelog, Oct 28, 2026](https://github.blog/changelog/2026-10-28-github-copilot-fusion-now-supports-selection-of-local-models/)
- [Adding LLM models to Copilot CLI — GitHub Docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-llm-models)
- [Using BYOK models in Copilot CLI — GitHub Docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models)
- [Using BYOK models in the GitHub Copilot app — GitHub Docs](https://docs.github.com/en/copilot/how-tos/github-copilot-app/use-byok-models)
- [AI language models in VS Code](https://code.visualstudio.com/docs/agent-customization/language-models)
- [Microsoft takes MAI-Code-1.1-Flash local — AICoder, Oct 8, 2026](https://aicoder.com/news/news-20261008-microsoft-mai-code-1-1-flash-local-copilot-hydrafusion)
- [MAI-Code-1.1 Flash Local: 137B Model, 75GB RAM — ExplainX, Oct 8, 2026](https://www.explainx.ai/blog/mai-code-1-1-flash-local-windows-github-copilot-137b-surface-laptop-ultra-2026)
- [Foundry Local CLI reference — Microsoft Learn](https://learn.microsoft.com/azure/foundry-local/reference/reference-cli)
- [`foundry-local-sdk` — PyPI](https://pypi.org/project/foundry-local-sdk/)

**Models and measurements**

- [qwen3.8-flash-next tags — Ollama](https://ollama.com/library/qwen3.8-flash-next/tags)
- [Can I run Qwen3.8 Flash Next on 128GB — OpenClaw DC](https://openclawdc.com/blog/can-i-run-qwen-3-8-flash-next-128gb-ram/)
- [How to Run Qwen on a Mac: Qwen3.8-27B, Qwen 3.6, Flash-Next — llmcheck](https://llmcheck.net/guides/run-qwen-4-1-mac/) · [Apple Silicon LLM benchmarks — llmcheck](https://llmcheck.net/benchmarks)
- [MTPLX](https://www.mtplx.com/) · [MTPLX FAQ](https://www.mtplx.com/faq/)
- [The arithmetic behind picking a MacBook Pro for local LLMs](https://talkaiwith.substack.com/p/the-arithmetic-behind-picking-a-macbook)
- [`navikt/copilot` #1460: HydraFusion local routing vs nav-pilot local](https://github.com/navikt/copilot/issues/1460)
- [GitHub Copilot Fusion GA: Standard vs High vs Max, Benchmarks, Local Models and Pricing — AiCybr](https://aicybr.com/blog/github-hydrafusion-multi-model-copilot-routing)
