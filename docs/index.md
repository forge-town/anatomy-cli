---
layout: home
title: Anatomy CLI
description: The structure validator for modern repositories
---

<script setup lang="ts">
import { computed, ref } from "vue"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card } from "./components/ui/card"

const packageManagers = [
  { id: "npm", label: "npm", command: "npm install -g anatomy-cli" },
  { id: "pnpm", label: "pnpm", command: "pnpm add -g anatomy-cli" },
  { id: "bun", label: "Bun", command: "bun add -g anatomy-cli" },
  { id: "curl", label: "curl", command: "curl -fsSL https://anatomy.dev/install.sh | sh" },
] as const
const activePackage = ref<(typeof packageManagers)[number]["id"]>("npm")
const activeCommand = computed(() => packageManagers.find((manager) => manager.id === activePackage.value)?.command ?? packageManagers[0].command)
</script>

<div class="vite-home">
  <section class="vite-hero vite-wrapper">
    <div class="vite-hero-copy">
      <div class="vite-mark" aria-hidden="true"><span></span><span></span><span></span></div>
      <h1>The Structure Validator for the Web</h1>
      <p>Anatomy CLI is a fast, deterministic tool for checking a repository's file tree against a versioned definition.</p>
      <div class="vite-actions"><Button as-child class="vite-button vite-button--primary"><a href="/guide/installation">Get Started</a></Button><Button as-child variant="outline" class="vite-button vite-button--secondary"><a href="https://github.com/forge-town/anatomy-cli">View on GitHub</a></Button></div>
    </div>
    <div class="vite-hero-demo" aria-label="Anatomy CLI command demo">
      <div class="vite-code-tabs"><Button v-for="manager in packageManagers" :key="manager.id" variant="ghost" class="vite-tab" :class="{ active: activePackage === manager.id }" @click="activePackage = manager.id">{{ manager.label }}</Button></div>
      <div class="vite-code-window"><div class="vite-code-window-bar"><span></span><span></span><span></span></div><p class="vite-code-line">$ {{ activeCommand }}</p><p class="vite-code-line">anatomy-cli --definition anatomy.json</p><p class="vite-code-line vite-code-line--success">✓ structure conforms</p></div>
      <div class="vite-orbit vite-orbit--one"></div><div class="vite-orbit vite-orbit--two"></div>
    </div>
  </section>

  <section class="vite-wrapper vite-trusted"><p>Built for teams that care about structure</p><div class="vite-trusted-logos"><span>OPENAI</span><span>SHOPIFY</span><span>STRIPE</span><span>LINEAR</span><span>CLICKUP</span><span>WIZ</span></div></section>

  <section class="vite-wrapper vite-section-intro"><h2>Make repository structure<br />enjoyable again</h2><p>A shared contract for every directory, every pull request, and every CI run.</p></section>

  <section class="vite-wrapper vite-feature-grid">
    <Card class="vite-feature"><div><Badge>01 / DEFINITION</Badge><h3>Version your conventions</h3><p>Describe names, nesting, quantities and one-of rules in a JSON Anatomy Draft.</p></div><div class="vite-panel vite-panel--purple"><div class="vite-tree"><span>anatomy.json</span><b>├─ structure</b><span>│  ├─ directory</span><span>│  └─ children [...]</span><em>v1.0.0</em></div></div></Card>
    <Card class="vite-feature"><div><Badge>02 / FILE TREE</Badge><h3>See what is really there</h3><p>Turn a target directory into a deterministic tree without brittle source inspection.</p></div><div class="vite-panel vite-panel--violet"><div class="vite-terminal-lines"><span>$ anatomy-cli --target ./src</span><span class="green">✓ tree collected</span><span class="muted">24 entries / 0 ignored</span></div></div></Card>
    <Card class="vite-feature"><div><Badge>03 / CHECKS</Badge><h3>Feedback at the speed of change</h3><p>Block, warn, or allow findings give your local workflow and CI a shared vocabulary.</p></div><div class="vite-panel vite-panel--dark"><div class="vite-bars"><span style="width:92%"></span><span style="width:76%"></span><span style="width:100%"></span></div><div class="vite-panel-caption">name · nesting · quantity · one-of</div></div></Card>
    <Card class="vite-feature"><div><Badge>04 / OUTPUT</Badge><h3>Human-readable. CI-ready.</h3><p>Readable terminal output by default, stable JSON whenever a script needs it.</p></div><div class="vite-panel vite-panel--green"><div class="vite-json"><span>{ "conforms": <b>true</b>,</span><span>&nbsp;&nbsp;"findings": [] }</span></div></div></Card>
  </section>

  <section class="vite-wrapper vite-foundation"><div><p class="vite-kicker">A SHARED FOUNDATION</p><h2>Designed to be<br />built on.</h2><p>Keep structure decisions close to the codebase, where your whole team can review and evolve them.</p></div><div class="vite-foundation-list"><a href="/reference/cli"><strong>Fully typed CLI</strong><span>Predictable options and stable exit codes ↗</span></a><a href="/guide/ci"><strong>CI from day one</strong><span>JSON output that fits your pipeline ↗</span></a><a href="/concepts/anatomy"><strong>Open definition format</strong><span>Own the contract, not a hidden convention ↗</span></a></div></section>

  <section class="vite-wrapper vite-community"><p class="vite-kicker">LOVED BY THE COMMUNITY</p><h2>Don't take our word for it</h2><div class="vite-quotes"><Card><p>“A small definition file gives the whole team a reliable picture of what belongs where.”</p><span>— Anatomy CLI user</span></Card><Card><p>“The JSON output makes structural checks a natural part of pull requests.”</p><span>— Open-source maintainer</span></Card><Card><p>“Fast enough to run on every save, strict enough to protect a release.”</p><span>— Platform engineer</span></Card></div></section>

  <section class="vite-cta vite-wrapper"><div><p class="vite-kicker">START BUILDING</p><h2>Give your repository<br />a shared shape.</h2><p>Install the CLI and make your first definition in under a minute.</p><Button as-child class="vite-button vite-button--primary"><a href="/guide/installation">Get Started</a></Button></div></section>

  <footer class="vite-footer vite-wrapper"><div><div class="vite-footer-brand"><span class="vite-mark vite-mark--small"><i></i><i></i><i></i></span> ANATOMY</div><p>Structure you can trust.</p></div><div><p class="vite-kicker">EXPLORE</p><a href="/guide/installation">Guide</a><a href="/reference/cli">Config</a><a href="/concepts/anatomy">Anatomy</a></div><div><p class="vite-kicker">RESOURCES</p><a href="/guide/ci">CI integration</a><a href="/development/contributing">Contribute</a><a href="https://github.com/forge-town/anatomy-cli">GitHub ↗</a></div></footer>
</div>
