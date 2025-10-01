import { DomainInfo } from '@/lib/types';

interface DomainSelectorProps {
  domains: DomainInfo[];
  selectedDomains: string[];
  onDomainsChange: (domainIds: string[]) => void;
  disabled?: boolean;
}

/**
 * DomainSelector component
 *
 * Multi-select domain picker
 * Shows domain abbreviation and description
 * Allows multiple selections
 */
export default function DomainSelector({
  domains,
  selectedDomains,
  onDomainsChange,
  disabled = false
}: DomainSelectorProps) {
  const toggleDomain = (domainId: string) => {
    if (disabled) return;

    if (selectedDomains.includes(domainId)) {
      // Remove domain
      onDomainsChange(selectedDomains.filter(id => id !== domainId));
    } else {
      // Add domain
      onDomainsChange([...selectedDomains, domainId]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        1. Select Domain(s)
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose one or more Common Core domains that apply to this task.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {domains.map((domain) => {
          const isSelected = selectedDomains.includes(domain.id);

          return (
            <button
              key={domain.id}
              onClick={() => toggleDomain(domain.id)}
              disabled={disabled}
              className={`
                p-3 rounded-md border-2 transition-all text-left
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`${domain.description_de || domain.description}\n\n${domain.description}`}
            >
              <div className="font-bold text-lg">{domain.name}</div>
              <div className="text-xs">
                <div className="truncate">{domain.description_de || domain.description}</div>
                <div className="truncate italic text-gray-500 mt-0.5">{domain.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedDomains.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Selected: {selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
