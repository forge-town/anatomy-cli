<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>
<template><div :class="cn('rounded-md border border-[#3b3440] bg-[#14121a] text-white', props.class)"><slot /></div></template>
