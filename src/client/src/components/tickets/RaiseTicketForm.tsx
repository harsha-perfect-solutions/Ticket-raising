import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ticketApi, adminApi, customerApi, kbApi } from '../../services/api';
import {
  Category,
  Customer,
  TicketPriority,
  TicketSource,
  Ticket,
  KBArticle,
  TicketTemplate,
  FileAttachmentItem,
} from '../../types';
import {
  X,
  PlusCircle,
  AlertCircle,
  PhoneCall,
  Search,
  User,
  Paperclip,
  CheckCircle2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Shield,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Building,
  Layers,
  Laptop,
  MapPin,
  Phone,
  Mail,
  HelpCircle,
  Zap,
  Bookmark,
  Eye,
  Trash2,
  Check,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  Send,
  BookOpen,
  Clock,
} from 'lucide-react';
import { NewCustomerModal } from '../modals/NewCustomerModal';
import { ArticleModal } from '../modals/ArticleModal';
import { useNavigate } from 'react-router-dom';

// 10 Curated Ticket Templates
const TICKET_TEMPLATES: TicketTemplate[] = [
  {
    id: 'tmpl-password-reset',
    name: 'Password Reset',
    categoryKeyword: 'Account Access',
    subcategoryKeyword: 'Password',
    defaultSubject: 'Password Reset Request',
    descriptionPrompt: `System / Service Name: Corporate Account Portal\nEmployee Username / Email: \nReason for Reset: Forgotten password / Expiration\nContact Phone for Verification: `,
    priority: 'MEDIUM',
  },
  {
    id: 'tmpl-account-locked',
    name: 'Account Locked Out',
    categoryKeyword: 'Account Access',
    subcategoryKeyword: 'Locked',
    defaultSubject: 'Account Locked Out - Unlock Request',
    descriptionPrompt: `Affected Username / Email: \nTime Locked: \nError Message Observed: Account has been locked due to multiple failed attempts\nUrgency / Business Impact: Unable to access work tools`,
    priority: 'HIGH',
  },
  {
    id: 'tmpl-laptop-hardware',
    name: 'Laptop / Hardware Issue',
    categoryKeyword: 'Technical Support',
    subcategoryKeyword: 'Display',
    defaultSubject: 'Hardware Malfunction / Equipment Defect',
    descriptionPrompt: `Asset Tag / Serial Number: \nDevice Model: (e.g. MacBook Pro M2, Dell Latitude)\nIssue Details: Screen flickering / Docking station power / Peripheral defect\nPhysical Location / Desk: `,
    priority: 'MEDIUM',
  },
  {
    id: 'tmpl-software-install',
    name: 'Software Installation',
    categoryKeyword: 'Software Glitch',
    subcategoryKeyword: 'UI',
    defaultSubject: 'Software Installation / License Provisioning',
    descriptionPrompt: `Software Name & Version: \nLicense Type: (Individual / Team / Open Source)\nBusiness Justification: \nOperating System: (Windows 11 / macOS)`,
    priority: 'LOW',
  },
  {
    id: 'tmpl-vpn-issue',
    name: 'VPN Issue',
    categoryKeyword: 'Technical Support',
    subcategoryKeyword: 'Data Sync',
    defaultSubject: 'VPN Connection Failure & Remote Disconnects',
    descriptionPrompt: `VPN Client Version: \nGateway Server: (Primary US-East / Secondary EU-West)\nError Message / Code: Connection timeout during handshake\nLocal Network Type: Home Wi-Fi / Mobile Hotspot`,
    priority: 'HIGH',
  },
  {
    id: 'tmpl-network-issue',
    name: 'Network Connectivity',
    categoryKeyword: 'Technical Support',
    subcategoryKeyword: 'Crash',
    defaultSubject: 'Office Wi-Fi / Ethernet Network Connectivity Issue',
    descriptionPrompt: `Network Name (SSID): SupportPro-Corp\nOffice Location / Floor: \nIP Address (if known): \nSymptoms: High latency / DNS resolution failure / No internet`,
    priority: 'MEDIUM',
  },
  {
    id: 'tmpl-email-issue',
    name: 'Email & Calendar Issue',
    categoryKeyword: 'Technical Support',
    subcategoryKeyword: 'Data Sync',
    defaultSubject: 'Outlook / Corporate Email Sync Problem',
    descriptionPrompt: `Email Address: \nClient Used: Outlook Desktop / Webmail / Mobile Mail\nSpecific Error / Symptom: Emails stuck in Outbox / Calendar invites not updating\nWhen Started: `,
    priority: 'MEDIUM',
  },
  {
    id: 'tmpl-access-request',
    name: 'Access Request',
    categoryKeyword: 'Account Access',
    subcategoryKeyword: 'Role Permission',
    defaultSubject: 'Permission & System Access Request',
    descriptionPrompt: `System / Database / Folder: \nAccess Level Needed: Read-Only / Read-Write / Admin\nManager Approver Name & Email: \nReason for Access: Project onboarding / Team transfer`,
    priority: 'MEDIUM',
  },
  {
    id: 'tmpl-app-error',
    name: 'Application Error 500',
    categoryKeyword: 'Software Glitch',
    subcategoryKeyword: 'Crash',
    defaultSubject: 'Internal Application Crash / Error 500',
    descriptionPrompt: `Application / Page URL: \nAction Attempted: \nExact Error Message: Server Error 500 / Unexpected Exception\nBrowser & Version: Chrome / Edge / Firefox`,
    priority: 'CRITICAL',
  },
  {
    id: 'tmpl-general-it',
    name: 'General IT Inquiry',
    categoryKeyword: 'Technical Support',
    subcategoryKeyword: 'UI',
    defaultSubject: 'General IT Assistance Request',
    descriptionPrompt: `Summary of Request: \nDepartment: \nPreferred Resolution Time: `,
    priority: 'LOW',
  },
];

interface TicketDraftData {
  subject: string;
  description: string;
  priority: TicketPriority;
  source: TicketSource;
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  assetDevice: string;
  location: string;
  contactPhone: string;
  preferredContact: 'EMAIL' | 'PHONE' | 'IN_APP';
  callSummary: string;
  raisingForSelf: boolean;
  selectedCustomerId?: string;
  watchers: string[];
  selectedTemplateId: string | null;
  savedAt: number;
}

export interface RaiseTicketFormProps {
  isModal?: boolean;
  onClose?: () => void;
  onNavigate?: (page: string, ticketId?: string) => void;
  preSelectedCustomer?: Customer | null;
}

export const RaiseTicketForm: React.FC<RaiseTicketFormProps> = ({
  isModal = false,
  onClose,
  onNavigate,
  preSelectedCustomer = null,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role ? user.role.toLowerCase() : 'customer';
  const isCustomer = user?.role === 'CUSTOMER';
  const isTelecaller = user?.role === 'TELECALLER';
  const isStaff = ['ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'].includes(user?.role || '');

  const DRAFT_STORAGE_KEY = `resolvehub_ticket_draft_${user?.id || 'anon'}_${rolePrefix}`;

  // Category & Routing state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Form Fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [source, setSource] = useState<TicketSource>(
    isCustomer ? 'CUSTOMER_PORTAL' : isTelecaller ? 'TELECALLER' : 'PHONE'
  );

  // Optional Context Fields
  const [assetDevice, setAssetDevice] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [preferredContact, setPreferredContact] = useState<'EMAIL' | 'PHONE' | 'IN_APP'>('EMAIL');
  const [callSummary, setCallSummary] = useState('');

  // Customer selection for Telecallers / Staff
  const [raisingForSelf, setRaisingForSelf] = useState<boolean>(!isTelecaller);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(preSelectedCustomer);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // Multi-attachment state with resilient per-file status
  const [attachments, setAttachments] = useState<FileAttachmentItem[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission & Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Confirmation state
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // FEATURE 1: DRAFT AUTO-SAVE STATE
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [savedDraftData, setSavedDraftData] = useState<TicketDraftData | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // FEATURE 2: TICKET TEMPLATES STATE
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // FEATURE 3: DUPLICATE DETECTION STATE
  const [duplicateTickets, setDuplicateTickets] = useState<Ticket[]>([]);
  const [hasDismissedDuplicateWarning, setHasDismissedDuplicateWarning] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // FEATURE 4: KNOWLEDGE BASE DEFLECTION STATE
  const [kbSuggestions, setKbSuggestions] = useState<KBArticle[]>([]);
  const [activeKbArticle, setActiveKbArticle] = useState<KBArticle | null>(null);
  const [isSearchingKb, setIsSearchingKb] = useState(false);
  const [deflectedArticle, setDeflectedArticle] = useState<KBArticle | null>(null);

  // FEATURE 5: CC / ADDITIONAL WATCHERS STATE
  const [watchers, setWatchers] = useState<string[]>([]);
  const [watcherInput, setWatcherInput] = useState('');
  const [watcherError, setWatcherError] = useState<string | null>(null);

  // 1. Check for saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed: TicketDraftData = JSON.parse(raw);
        if (parsed && (parsed.subject?.trim() || parsed.description?.trim())) {
          setSavedDraftData(parsed);
          setHasSavedDraft(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved draft from localStorage', e);
    }
  }, [DRAFT_STORAGE_KEY]);

  // 2. Load Categories on mount
  useEffect(() => {
    loadCategories();
    if (preSelectedCustomer) {
      setSelectedCustomer(preSelectedCustomer);
      setRaisingForSelf(false);
    }
  }, [preSelectedCustomer]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await adminApi.getCategories();
      if (res.data.success && res.data.categories.length > 0) {
        setCategories(res.data.categories);
        // Default to first active category if not already set
        if (!selectedCategoryId) {
          const first = res.data.categories[0];
          setSelectedCategoryId(first.id);
          if (first.defaultPriority) {
            setPriority(first.defaultPriority);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load categories', err);
      setSubmitError('Unable to load ticket categories. Please refresh or try again.');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];
  const derivedDepartmentName = selectedCategoryObj?.department?.name || 'General Support';

  // 3. Debounced Draft Auto-Save
  useEffect(() => {
    if (createdTicket || deflectedArticle) return;
    if (!subject.trim() && !description.trim() && watchers.length === 0) return;

    const timer = setTimeout(() => {
      const draft: TicketDraftData = {
        subject,
        description,
        priority,
        source,
        selectedCategoryId,
        selectedSubcategoryId,
        assetDevice,
        location,
        contactPhone,
        preferredContact,
        callSummary,
        raisingForSelf,
        selectedCustomerId: selectedCustomer?.id,
        watchers,
        selectedTemplateId,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        const d = new Date();
        setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.warn('Failed to auto-save draft to localStorage', e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    subject,
    description,
    priority,
    source,
    selectedCategoryId,
    selectedSubcategoryId,
    assetDevice,
    location,
    contactPhone,
    preferredContact,
    callSummary,
    raisingForSelf,
    selectedCustomer,
    watchers,
    selectedTemplateId,
    createdTicket,
    deflectedArticle,
    DRAFT_STORAGE_KEY,
  ]);

  // 4. Debounced Duplicate Ticket Detection
  useEffect(() => {
    if (hasDismissedDuplicateWarning) return;
    if (subject.trim().length < 4) {
      setDuplicateTickets([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const res = await ticketApi.checkDuplicate({
          customerId: !raisingForSelf && selectedCustomer ? selectedCustomer.id : undefined,
          categoryId: selectedCategoryId || undefined,
          subcategoryId: selectedSubcategoryId || undefined,
          subject: subject.trim(),
          description: description.trim(),
        });
        if (res.data.success && res.data.hasDuplicate) {
          setDuplicateTickets(res.data.duplicates);
        } else {
          setDuplicateTickets([]);
        }
      } catch (err) {
        console.error('Duplicate check error:', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    subject,
    selectedCategoryId,
    selectedSubcategoryId,
    raisingForSelf,
    selectedCustomer,
    hasDismissedDuplicateWarning,
  ]);

  // 5. Debounced Knowledge Base Deflection Search
  useEffect(() => {
    if (subject.trim().length < 3) {
      setKbSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingKb(true);
      try {
        const res = await kbApi.search({
          q: subject.trim(),
          category: selectedCategoryObj?.name,
        });
        if (res.data.success) {
          setKbSuggestions(res.data.articles);
        }
      } catch (err) {
        console.error('KB search error:', err);
      } finally {
        setIsSearchingKb(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [subject, selectedCategoryId, selectedCategoryObj]);

  // Category change handler
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId('');
    const matched = categories.find((c) => c.id === catId);
    if (matched?.defaultPriority) {
      setPriority(matched.defaultPriority);
    }
    if (formErrors.category) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.category;
        return copy;
      });
    }
  };

  // Customer search for Telecaller / Staff
  const handleCustomerSearch = async (query: string) => {
    setCustomerSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingCustomer(true);
    try {
      const res = await customerApi.search(query);
      if (res.data.success) {
        setSearchResults(res.data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // FEATURE 1: DRAFT HANDLERS
  const handleResumeDraft = () => {
    if (!savedDraftData) return;
    if (savedDraftData.subject) setSubject(savedDraftData.subject);
    if (savedDraftData.description) setDescription(savedDraftData.description);
    if (savedDraftData.priority) setPriority(savedDraftData.priority);
    if (savedDraftData.source) setSource(savedDraftData.source);
    if (savedDraftData.selectedCategoryId) setSelectedCategoryId(savedDraftData.selectedCategoryId);
    if (savedDraftData.selectedSubcategoryId) setSelectedSubcategoryId(savedDraftData.selectedSubcategoryId);
    if (savedDraftData.assetDevice) setAssetDevice(savedDraftData.assetDevice);
    if (savedDraftData.location) setLocation(savedDraftData.location);
    if (savedDraftData.contactPhone) setContactPhone(savedDraftData.contactPhone);
    if (savedDraftData.preferredContact) setPreferredContact(savedDraftData.preferredContact);
    if (savedDraftData.callSummary) setCallSummary(savedDraftData.callSummary);
    if (savedDraftData.watchers && Array.isArray(savedDraftData.watchers)) setWatchers(savedDraftData.watchers);
    if (savedDraftData.selectedTemplateId) setSelectedTemplateId(savedDraftData.selectedTemplateId);
    setHasSavedDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSavedDraftData(null);
    setHasSavedDraft(false);
    setLastSavedTime(null);
  };

  const handleDeleteDraft = () => {
    handleDiscardDraft();
  };

  // FEATURE 2: TEMPLATE SELECTION
  const handleSelectTemplate = (template: TicketTemplate) => {
    setSelectedTemplateId(template.id);
    setSubject(template.defaultSubject);
    setDescription(template.descriptionPrompt);
    setPriority(template.priority);

    // Smart mapping to database Category
    if (categories.length > 0) {
      const matchedCat = categories.find((c) =>
        c.name.toLowerCase().includes(template.categoryKeyword.toLowerCase())
      );
      if (matchedCat) {
        setSelectedCategoryId(matchedCat.id);
        // Smart mapping to child Subcategory
        if (template.subcategoryKeyword && matchedCat.subcategories) {
          const matchedSub = matchedCat.subcategories.find((s) =>
            s.name.toLowerCase().includes(template.subcategoryKeyword!.toLowerCase())
          );
          if (matchedSub) {
            setSelectedSubcategoryId(matchedSub.id);
          } else {
            setSelectedSubcategoryId('');
          }
        } else {
          setSelectedSubcategoryId('');
        }
      }
    }

    // Clear validation errors
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.subject;
      delete copy.description;
      delete copy.category;
      return copy;
    });
  };

  // FEATURE 5: CC / WATCHER HANDLERS
  const handleAddWatcher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setWatcherError(null);
    const email = watcherInput.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setWatcherError('Please enter a valid email address (e.g. name@company.com).');
      return;
    }
    if (email === user?.email.toLowerCase()) {
      setWatcherError('You are the requester and will automatically receive updates.');
      return;
    }
    if (watchers.includes(email)) {
      setWatcherError('This email is already in the CC / Watcher list.');
      return;
    }

    setWatchers((prev) => [...prev, email]);
    setWatcherInput('');
  };

  const handleRemoveWatcher = (emailToRemove: string) => {
    setWatchers((prev) => prev.filter((w) => w !== emailToRemove));
  };

  // FEATURE 6: ATTACHMENT HANDLERS (RESILIENT WITH PER-FILE STATUS)
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: FileAttachmentItem[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (attachments.some((f) => f.name === file.name && f.size === file.size)) {
        return; // Duplicate
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push('File exceeds the 15 MB limit.');
        return;
      }
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
      const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
      const forbiddenExts = ['.zip', '.rar', '.doc', '.docx', '.xls', '.xlsx', '.exe', '.js', '.html', '.svg'];

      if ((!isExtAllowed && !isMimeAllowed) || forbiddenExts.includes(ext)) {
        errors.push('Unsupported file type. Please upload JPG, JPEG, PNG, or PDF files only.');
        return;
      }
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
      });
    });

    if (errors.length > 0) {
      setFormErrors((prev) => ({ ...prev, attachments: errors[0] }));
    } else {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.attachments;
        return copy;
      });
    }

    if (newItems.length > 0) {
      setAttachments((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleRetryAttachment = async (item: FileAttachmentItem, ticketId: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: 'uploading', error: undefined } : a))
    );
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      await ticketApi.uploadAttachment(ticketId, formData);
      setAttachments((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: 'uploaded' } : a))
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Retry failed';
      setAttachments((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: 'failed', error: msg } : a))
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    handleAddFiles(e.dataTransfer.files);
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!subject.trim()) {
      errors.subject = 'Please enter a ticket subject / issue summary.';
    } else if (subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters long.';
    } else if (subject.trim().length > 200) {
      errors.subject = 'Subject cannot exceed 200 characters.';
    }

    if (!description.trim()) {
      errors.description = 'Please provide detailed description of the issue.';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    }

    if (!selectedCategoryId) {
      errors.category = 'Please select a category for this ticket.';
    }

    if (!raisingForSelf && !selectedCustomer && isStaff) {
      errors.customer = 'Please search and select a customer, or choose "Raise for myself".';
    }

    if (contactPhone.trim() && !/^[0-9]{10}$/.test(contactPhone.trim())) {
      errors.contactPhone = 'Please enter a valid 10-digit mobile number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build formatted description incorporating optional context
      let enrichedDescription = description.trim();
      const metaParts: string[] = [];
      if (assetDevice.trim()) metaParts.push(`- **Asset / Device:** ${assetDevice.trim()}`);
      if (location.trim()) metaParts.push(`- **Location:** ${location.trim()}`);
      if (contactPhone.trim()) metaParts.push(`- **Contact Number:** ${contactPhone.trim()}`);
      if (preferredContact) metaParts.push(`- **Preferred Contact:** ${preferredContact}`);

      if (metaParts.length > 0) {
        enrichedDescription += `\n\n---\n**Requester & Environment Information:**\n${metaParts.join('\n')}`;
      }

      const payload: any = {
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId || undefined,
        subject: subject.trim(),
        description: enrichedDescription,
        priority,
        source: raisingForSelf && isCustomer ? 'CUSTOMER_PORTAL' : source,
        callSummary: isTelecaller && callSummary.trim() ? callSummary.trim() : undefined,
        watchers: watchers.length > 0 ? watchers : undefined,
      };

      if (!raisingForSelf && selectedCustomer) {
        payload.customerId = selectedCustomer.id;
      }

      // Step 1: Create Ticket
      setUploadProgressText('Creating ticket & calculating SLA...');
      const res = await ticketApi.create(payload);

      if (!res.data.success || !res.data.ticket) {
        throw new Error((res.data as any).message || 'Failed to create ticket');
      }

      const newTicket = res.data.ticket;

      // Step 2: Upload Attachments Resiliently
      if (attachments.length > 0) {
        setUploadProgressText(`Uploading attachments (0/${attachments.length})...`);
        for (let i = 0; i < attachments.length; i++) {
          const item = attachments[i];
          setUploadProgressText(`Uploading "${item.name}" (${i + 1}/${attachments.length})...`);
          setAttachments((prev) =>
            prev.map((a) => (a.id === item.id ? { ...a, status: 'uploading' } : a))
          );

          try {
            const formData = new FormData();
            formData.append('file', item.file);
            await ticketApi.uploadAttachment(newTicket.id, formData);
            setAttachments((prev) =>
              prev.map((a) => (a.id === item.id ? { ...a, status: 'uploaded' } : a))
            );
          } catch (uploadErr: any) {
            console.error(`Failed to upload ${item.name}:`, uploadErr);
            const errMsg = uploadErr.response?.data?.message || 'File upload failed';
            setAttachments((prev) =>
              prev.map((a) => (a.id === item.id ? { ...a, status: 'failed', error: errMsg } : a))
            );
          }
        }
      }

      // Step 3: Clear Saved Draft from localStorage
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setLastSavedTime(null);
      } catch (e) {
        console.warn(e);
      }

      // Step 4: Show Success Screen State
      setCreatedTicket(newTicket);
    } catch (err: any) {
      console.error('Ticket submission error:', err);
      const msg =
        err.response?.data?.message || err.message || 'Unable to submit ticket. Please verify your details and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText(null);
    }
  };

  const handleResetForm = () => {
    setCreatedTicket(null);
    setDeflectedArticle(null);
    setSubject('');
    setDescription('');
    setAssetDevice('');
    setLocation('');
    setAttachments([]);
    setWatchers([]);
    setCallSummary('');
    setSelectedTemplateId(null);
    setDuplicateTickets([]);
    setHasDismissedDuplicateWarning(false);
    setFormErrors({});
    setSubmitError(null);
    handleDiscardDraft();
  };

  // Priority styling and badges
  const priorityInfo = {
    CRITICAL: {
      color: 'border-rose-500 bg-rose-50/50 text-rose-700',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      label: 'Critical',
      desc: 'Business-critical outage or complete blocker requiring immediate response.',
    },
    HIGH: {
      color: 'border-amber-500 bg-amber-50/50 text-amber-700',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      label: 'High',
      desc: 'Major functionality failure affecting important operational work.',
    },
    MEDIUM: {
      color: 'border-blue-500 bg-blue-50/50 text-blue-700',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'Medium',
      desc: 'Standard issue or defect affecting productivity, but with workarounds.',
    },
    LOW: {
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'Low',
      desc: 'Minor inquiry, cosmetic request, or non-urgent operational question.',
    },
  };

  // =========================================================================
  // DEFLECTION SUCCESS SCREEN (Issue Solved via Knowledge Base)
  // =========================================================================
  if (deflectedArticle) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm animate-fade-in text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
          Self-Service Deflection
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          Issue Resolved Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6">
          Great! We're glad you found a solution through our knowledge base article{' '}
          <span className="font-bold text-slate-800">"{deflectedArticle.title}"</span>. No ticket was required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('dashboard');
              } else {
                navigate(`/${rolePrefix}/dashboard`);
              }
              if (onClose) onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleResetForm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Raise Another Ticket</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS SCREEN RENDER
  // =========================================================================
  if (createdTicket) {
    const failedUploads = attachments.filter((a) => a.status === 'failed');

    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm animate-fade-in text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
          Ticket Raised Successfully
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          Your support request is submitted!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6">
          Your ticket has been logged with an initial status of{' '}
          <span className="font-bold text-slate-900">{createdTicket.status}</span> and
          {createdTicket.assignedAgent ? (
            <>
              {' '}automatically allocated to{' '}
              <span className="font-bold text-blue-600">{createdTicket.assignedAgent.fullName}</span>.
            </>
          ) : (
            <> automatically routed to the appropriate support queue.</>
          )}
        </p>

        {/* Failed attachments warning if any */}
        {failedUploads.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Some attachments failed to upload:</span>
            </div>
            {failedUploads.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs text-amber-800 bg-white/70 p-2 rounded-lg border border-amber-200">
                <span className="truncate max-w-xs">{item.name} ({item.error || 'Failed'})</span>
                <button
                  type="button"
                  onClick={() => handleRetryAttachment(item, createdTicket.id)}
                  className="px-2.5 py-1 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors"
                >
                  Retry Upload
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Details Card */}
        <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 sm:p-6 text-left mb-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-xs font-semibold text-slate-500">Ticket ID</span>
            <span className="font-mono text-sm font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {createdTicket.ticketNumber}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-xs font-semibold text-slate-500">Subject</span>
            <span className="text-xs font-bold text-slate-900 text-right max-w-xs truncate">
              {createdTicket.subject}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-xs font-semibold text-slate-500">Priority</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${priorityInfo[createdTicket.priority].badge}`}>
              {createdTicket.priority}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-xs font-semibold text-slate-500">Assigned Department</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              {createdTicket.department?.name || derivedDepartmentName}
            </span>
          </div>

          {createdTicket.assignedAgent && (
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-semibold text-slate-500">Allocated Staff</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {createdTicket.assignedAgent.fullName} ({createdTicket.assignedAgent.role})
              </span>
            </div>
          )}

          {watchers.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-semibold text-slate-500">CC Watchers</span>
              <span className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                {watchers.join(', ')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Attachments</span>
            <span className="text-xs font-semibold text-slate-700">
              {attachments.filter((a) => a.status === 'uploaded').length} file(s) attached
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('ticket-details', createdTicket.id);
              } else {
                navigate(`/${rolePrefix}/tickets/${createdTicket.id}`);
              }
              if (onClose) onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>View & Track Ticket</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('dashboard');
              } else {
                navigate(`/${rolePrefix}/dashboard`);
              }
              if (onClose) onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
          >
            Back to Dashboard
          </button>

          <button
            onClick={handleResetForm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Raise Another Ticket</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN FORM RENDER
  // =========================================================================
  return (
    <div className={`w-full ${isModal ? '' : 'max-w-4xl mx-auto'}`}>
      {/* FEATURE 1: RESUME SAVED DRAFT BANNER */}
      {hasSavedDraft && savedDraftData && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">Resume your saved draft?</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                You have an unsaved ticket draft{savedDraftData.subject ? ` ("${savedDraftData.subject}")` : ''} from{' '}
                {new Date(savedDraftData.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResumeDraft}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Resume Draft</span>
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 font-semibold text-xs transition-colors"
            >
              Start New Ticket
            </button>
            <button
              type="button"
              onClick={handleDeleteDraft}
              className="p-1.5 rounded-lg text-amber-700 hover:text-rose-600 hover:bg-amber-100 transition-colors"
              title="Delete Saved Draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header (Non-modal view) */}
      {!isModal && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              ITSM Service Portal
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Raise a Support Ticket
              </h1>
              {lastSavedTime && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Draft saved at {lastSavedTime}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Submit incident reports, service requests, or technical inquiries for rapid automated routing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('tickets');
                } else {
                  navigate(`/${rolePrefix}/tickets`);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>My Tickets Queue</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isModal && (
          <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {isCustomer ? 'Submit Support Request' : 'Raise New Support Ticket'}
                  </h2>
                  {lastSavedTime && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      Draft saved {lastSavedTime}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Instant routing to specialized department & automated tracking</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
          {/* Submit / Server Error Alert */}
          {submitError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Submission Failed</p>
                <p className="text-rose-600/90 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* FEATURE 2: TICKET TEMPLATES CAROUSEL / SELECTOR */}
          <div className="bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/30 border border-blue-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Quick-Fill Templates
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Click a frequent issue to pre-fill category & form prompts
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {TICKET_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <span>{tmpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: REQUESTER INFORMATION */}
          <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Requester Information
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                <Shield className="w-3 h-3" />
                Authenticated Session
              </span>
            </div>

            {/* If Staff / Telecaller: Choice between self or customer */}
            {isStaff && !isCustomer && (
              <div className="mb-4">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="raisingTarget"
                      checked={raisingForSelf}
                      onChange={() => setRaisingForSelf(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Raise for myself ({user?.fullName})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="raisingTarget"
                      checked={!raisingForSelf}
                      onChange={() => setRaisingForSelf(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Log on behalf of customer</span>
                  </label>
                </div>
              </div>
            )}

            {/* Customer Dossier Selection when logging on behalf of customer */}
            {!raisingForSelf && isStaff && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Search Customer <span className="text-rose-600">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    + Register New Customer
                  </button>
                </div>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedCustomer.name}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {selectedCustomer.phone} • {selectedCustomer.email} •{' '}
                        <span className="text-slate-500">{selectedCustomer.company || 'Individual Account'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search customer by name, phone number, or email..."
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-3.5 top-3">
                        <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setSearchResults([]);
                              setCustomerSearchQuery('');
                              setFormErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.customer;
                                return copy;
                              });
                            }}
                            className="p-3 text-xs hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{cust.name}</div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {cust.phone} • {cust.email}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {formErrors.customer && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.customer}
                  </p>
                )}
              </div>
            )}

            {/* Read-only User Summary Card */}
            {raisingForSelf && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Requester Name
                  </span>
                  <span className="font-bold text-slate-800">{user?.fullName || 'Authenticated User'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Email Address
                  </span>
                  <span className="font-bold text-slate-800 truncate block">{user?.email}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Role & Permissions
                  </span>
                  <span className="font-bold text-blue-600">{user?.role}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Department
                  </span>
                  <span className="font-bold text-slate-800">
                    {user?.department?.name || 'General Operations'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CATEGORY & AUTOMATIC ROUTING */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Category <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.department?.name || 'General'})
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.category}
                  </p>
                )}
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Subcategory {availableSubcategories.length > 0 && <span className="text-slate-400">(Optional)</span>}
                </label>
                <select
                  value={selectedSubcategoryId}
                  onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
                >
                  <option value="">General Issue / Standard</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Routing Notification Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Automatic Department Routing:</span>{' '}
                <span className="font-bold text-slate-900">
                  Will be routed to: <span className="text-blue-700">{derivedDepartmentName}</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Based on category '{selectedCategoryObj?.name || 'Technical'}', this incident will enter the specialized queue automatically.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: PRIORITY SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Severity & Priority Level <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => {
                const info = priorityInfo[p];
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? `border-blue-600 ring-2 ring-blue-100 bg-blue-50/40 shadow-sm`
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${info.badge}`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: ISSUE SUBJECT & DETAILED DESCRIPTION */}
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Subject / Summary <span className="text-rose-600">*</span>
                </label>
                <span className={`text-[11px] ${subject.length > 180 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {subject.length}/200
                </span>
              </div>
              <input
                type="text"
                maxLength={200}
                placeholder="Briefly describe your issue (e.g. Cannot connect to corporate VPN from remote office)"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setHasDismissedDuplicateWarning(false);
                  if (formErrors.subject) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.subject;
                      return copy;
                    });
                  }
                }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  formErrors.subject
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {formErrors.subject && (
                <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.subject}
                </p>
              )}
            </div>

            {/* FEATURE 4: KNOWLEDGE BASE DEFLECTION SUGGESTIONS */}
            {kbSuggestions.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 animate-fade-in space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                      💡 Suggested Solutions
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-700">
                    Solve your issue now before submitting
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {kbSuggestions.map((art) => (
                    <div
                      key={art.id}
                      className="p-3 rounded-xl bg-white border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            {art.category}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {art.readTimeMinutes}m
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{art.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveKbArticle(art)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Solution</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FEATURE 3: DUPLICATE OPEN TICKET WARNING */}
            {duplicateTickets.length > 0 && !hasDismissedDuplicateWarning && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300/90 shadow-sm animate-fade-in space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                        Possible Duplicate Ticket Detected
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        You already have an active open ticket that may be related to this issue. Please check before creating a new one:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {duplicateTickets.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-3 rounded-xl bg-white border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {dup.ticketNumber}
                          </span>
                          <span className="font-bold text-slate-900">{dup.subject}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Status: <span className="font-bold text-slate-700">{dup.status}</span> • Priority:{' '}
                          <span className="font-bold text-slate-700">{dup.priority}</span> • Created:{' '}
                          {new Date(dup.createdAt).toLocaleDateString()}
                          {dup.assignedAgent && ` • Agent: ${dup.assignedAgent.fullName}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('ticket-details', dup.id);
                            } else {
                              navigate(`/${rolePrefix}/tickets/${dup.id}`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors flex items-center gap-1"
                        >
                          <span>View Ticket</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setHasDismissedDuplicateWarning(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Continue Creating New Ticket
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Detailed Description <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {description.length} characters (min 10)
                </span>
              </div>
              <textarea
                rows={4}
                placeholder="Describe the issue in detail. Include what happened, when it started, what you were trying to do, and any error messages you received."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formErrors.description) {
                    setFormErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.description;
                      return copy;
                    });
                  }
                }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 transition-all resize-y min-h-[100px] ${
                  formErrors.description
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {formErrors.description && (
                <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.description}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 5: OPTIONAL CONTEXT (Asset, Location, Contact) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-700">Environment & Contact Details (Optional)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Asset / Device</label>
                <input
                  type="text"
                  placeholder="e.g. MacBook Pro, Dell Latitude"
                  value={assetDevice}
                  onChange={(e) => setAssetDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. HQ Floor 3 / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={contactPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setContactPhone(val);
                    if (val && !/^[0-9]{10}$/.test(val)) {
                      setFormErrors((prev) => ({ ...prev, contactPhone: 'Please enter a valid 10-digit mobile number.' }));
                    } else {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.contactPhone;
                        return copy;
                      });
                    }
                  }}
                  onBlur={() => {
                    if (contactPhone.trim() && !/^[0-9]{10}$/.test(contactPhone.trim())) {
                      setFormErrors((prev) => ({ ...prev, contactPhone: 'Please enter a valid 10-digit mobile number.' }));
                    }
                  }}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 ${
                    formErrors.contactPhone ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200'
                  }`}
                />
                {formErrors.contactPhone && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {formErrors.contactPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Contact</label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="EMAIL">Email Updates</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="IN_APP">In-App Portal</option>
                </select>
              </div>
            </div>
          </div>

          {/* FEATURE 5: CC / ADDITIONAL WATCHERS */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-700">CC / Additional Watchers (Optional)</h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Authorized colleagues to receive notifications
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Add collaborator email (e.g. manager@company.com)..."
                  value={watcherInput}
                  onChange={(e) => {
                    setWatcherInput(e.target.value);
                    if (watcherError) setWatcherError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWatcher();
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddWatcher()}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add CC</span>
              </button>
            </div>

            {watcherError && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {watcherError}
              </p>
            )}

            {watchers.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {watchers.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700"
                  >
                    <span>{w}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWatcher(w)}
                      className="text-blue-400 hover:text-blue-700 p-0.5 rounded-full hover:bg-blue-100 transition-colors"
                      title="Remove watcher"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Telecaller Call Summary if applicable */}
          {isTelecaller && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-amber-600" />
                Telecaller Verification & Inbound Call Log
              </label>
              <textarea
                rows={2}
                placeholder="Record call verification, caller identity confirmed, and any verbal instructions..."
                value={callSummary}
                onChange={(e) => setCallSummary(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* SECTION 6: RESILIENT MULTI-ATTACHMENTS */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Supporting Attachments <span className="text-slate-400 font-normal">(Screenshots, PDFs, Logs - Max 5 files, 15MB each)</span>
            </label>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDraggingFile
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
                accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-blue-600">Click to upload</span> or drag and drop files here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, JPEG, PNG, or PDF files only (up to 15 MB)
                  </p>
                </div>
              </div>
            </div>

            {formErrors.attachments && (
              <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {formErrors.attachments}
              </p>
            )}

            {/* Attached Files List with Status Badges & Retry */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((item) => {
                  const isImg = item.type.startsWith('image/');
                  const sizeFormatted =
                    item.size > 1024 * 1024
                      ? `${(item.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(item.size / 1024).toFixed(0)} KB`;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        item.status === 'failed'
                          ? 'bg-rose-50/60 border-rose-200'
                          : item.status === 'uploading'
                          ? 'bg-blue-50/50 border-blue-200 animate-pulse'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {isImg ? (
                          <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 truncate max-w-xs">{item.name}</span>
                        <span className="text-slate-400 text-[11px]">({sizeFormatted})</span>

                        {/* Status chip */}
                        {item.status === 'uploading' && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                            Uploading...
                          </span>
                        )}
                        {item.status === 'uploaded' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Ready
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> {item.error || 'Failed'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttachment(item.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 7: SUBMISSION ACTIONS */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              * Required fields must be completed before submission.
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{uploadProgressText || 'Submitting Ticket...'}</span>
                  </>
                ) : (
                  <>
                    <span>Submit Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modals */}
      {showNewCustomerModal && (
        <NewCustomerModal
          isOpen={showNewCustomerModal}
          onClose={() => setShowNewCustomerModal(false)}
          onCustomerCreated={(newCust) => {
            setSelectedCustomer(newCust);
            setShowNewCustomerModal(false);
          }}
        />
      )}

      {activeKbArticle && (
        <ArticleModal
          isOpen={Boolean(activeKbArticle)}
          article={activeKbArticle}
          onClose={() => setActiveKbArticle(null)}
          onResolved={(art) => {
            setActiveKbArticle(null);
            setDeflectedArticle(art);
          }}
        />
      )}
    </div>
  );
};

export default RaiseTicketForm;
