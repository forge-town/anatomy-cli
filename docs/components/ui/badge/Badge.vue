<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
const props = withDefaults(defineProps<{ class?: HTMLAttributes["class"] }>(), { class: "" });
</script>
<template><span :class="cn('inline-flex items-center rounded-full border border-[#32f3e9]/40 bg-[#32f3e9]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#32f3e9]', props.class)"><slot /></span></template>
