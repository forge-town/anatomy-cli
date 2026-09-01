<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
const props = withDefaults(defineProps<{ class?: HTMLAttributes["class"] }>(), { class: "" });
</script>
<template><div role="separator" :class="cn('h-px w-full bg-[#3b3440]', props.class)" /></template>
