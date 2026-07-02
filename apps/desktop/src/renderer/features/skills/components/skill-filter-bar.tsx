import { Search } from "lucide-react";
import { m } from "~/paraglide/messages";
import { InputGroup } from "@/components/ui/input-group";

interface SkillFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SkillFilterBar({
  searchTerm,
  onSearchChange,
}: SkillFilterBarProps): React.ReactElement {
  const placeholder = m.skills_search_placeholder();
  return (
    <InputGroup>
      <InputGroup.Icon>
        <Search className="size-4" strokeWidth={1.75} />
      </InputGroup.Icon>
      <InputGroup.Input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </InputGroup>
  );
}
