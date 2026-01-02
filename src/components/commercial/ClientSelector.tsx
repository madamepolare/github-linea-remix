import { useState, useEffect } from 'react';
import { Building2, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCRMCompanies } from '@/hooks/useCRMCompanies';
import { useContacts } from '@/hooks/useContacts';

interface ClientSelectorProps {
  selectedCompanyId?: string;
  selectedContactId?: string;
  onCompanyChange: (id: string | undefined) => void;
  onContactChange: (id: string | undefined) => void;
}

export function ClientSelector({
  selectedCompanyId,
  selectedContactId,
  onCompanyChange,
  onContactChange
}: ClientSelectorProps) {
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  const [searchCompany, setSearchCompany] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchCompany.toLowerCase())
  ).slice(0, 5);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchContact.toLowerCase());
    const matchesCompany = !selectedCompanyId || c.crm_company_id === selectedCompanyId;
    return matchesSearch && matchesCompany;
  }).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Company Selector */}
      <div className="space-y-2">
        <Label>Entreprise cliente</Label>
        <div className="relative">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={selectedCompany ? selectedCompany.name : searchCompany}
              onChange={(e) => {
                setSearchCompany(e.target.value);
                setShowCompanyDropdown(true);
                if (!e.target.value) {
                  onCompanyChange(undefined);
                }
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
              placeholder="Rechercher une entreprise..."
              className="pl-10"
            />
          </div>
          
          {showCompanyDropdown && filteredCompanies.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => {
                    onCompanyChange(company.id);
                    setSearchCompany('');
                    setShowCompanyDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3"
                >
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{company.name}</div>
                    {company.industry && (
                      <div className="text-xs text-muted-foreground">{company.industry}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {selectedCompany && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            {selectedCompany.logo_url ? (
              <img src={selectedCompany.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">{selectedCompany.name}</div>
              {selectedCompany.city && (
                <div className="text-xs text-muted-foreground">{selectedCompany.city}</div>
              )}
            </div>
            <button 
              onClick={() => onCompanyChange(undefined)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Changer
            </button>
          </div>
        )}
      </div>

      {/* Contact Selector */}
      <div className="space-y-2">
        <Label>Contact principal</Label>
        <div className="relative">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={selectedContact ? selectedContact.name : searchContact}
              onChange={(e) => {
                setSearchContact(e.target.value);
                setShowContactDropdown(true);
                if (!e.target.value) {
                  onContactChange(undefined);
                }
              }}
              onFocus={() => setShowContactDropdown(true)}
              onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
              placeholder="Rechercher un contact..."
              className="pl-10"
            />
          </div>
          
          {showContactDropdown && filteredContacts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    onContactChange(contact.id);
                    setSearchContact('');
                    setShowContactDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    {contact.email && (
                      <div className="text-xs text-muted-foreground">{contact.email}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {selectedContact && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{selectedContact.name}</div>
              {selectedContact.email && (
                <div className="text-xs text-muted-foreground">{selectedContact.email}</div>
              )}
            </div>
            <button 
              onClick={() => onContactChange(undefined)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Changer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
