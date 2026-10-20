<script lang="ts">
  import { Badge } from "@varavel/ui";

  interface Props {
    /** Field path or name shown as label. */
    name: string;
    /** True when the field may be omitted. */
    optional: boolean;
  }

  let { name, optional }: Props = $props();
</script>

<span class="flex items-center gap-2">
  <span class="truncate text-sm font-semibold">{name}</span>
  <Badge size="sm" variant="soft">{optional ? "optional" : "required"}</Badge>
</span>
