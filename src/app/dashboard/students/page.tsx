'use client';

import { useState, useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useSubscription,
} from '@apollo/client/react/index.js';
import { gql } from '@apollo/client/core/index.js';
import {
  Loader2,
  Edit2,
  Trash2,
  X,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertModal,
} from '@/components/ui/modal';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

const LIST_STUDENTS = gql`
  query ListStudents {
    listStudents {
      id
      name
      email
      username
      memberships {
        cohortId
        sessionId
        status
        cohort {
          name
        }
        session {
          name
        }
      }
    }
  }
`;
const LIST_COHORTS = gql`
  query ListCohortsForStudents {
    listCohorts {
      id
      name
      sessions {
        id
        name
      }
    }
  }
`;
type StudentCohortListData = {
  listCohorts: Array<{
    id: string;
    name: string;
    sessions: Array<{ id: string; name: string }>;
  }>;
};

const CREATE_STUDENT = gql`
  mutation AdminCreateStudent(
    $name: String!
    $email: String!
    $phone: String!
    $username: String!
    $password: String!
    $cohortId: String
    $sessionId: String
  ) {
    adminCreateStudent(
      name: $name
      email: $email
      phone: $phone
      username: $username
      password: $password
      cohortId: $cohortId
      sessionId: $sessionId
    ) {
      id
      name
      email
      username
    }
  }
`;
const UPDATE_STUDENT = gql`
  mutation AdminUpdateStudent(
    $id: String!
    $name: String
    $email: String
    $username: String
  ) {
    adminUpdateStudent(
      id: $id
      name: $name
      email: $email
      username: $username
    ) {
      id
      name
      email
      username
    }
  }
`;
const DELETE_STUDENT = gql`
  mutation AdminDeleteStudent($id: String!) {
    adminDeleteStudent(id: $id)
  }
`;
const ENROLL_STUDENT = gql`
  mutation AdminEnrollStudent(
    $userId: String!
    $cohortId: String!
    $sessionId: String!
  ) {
    adminEnrollStudent(
      userId: $userId
      cohortId: $cohortId
      sessionId: $sessionId
    )
  }
`;
const UPDATE_MEMBERSHIP = gql`
  mutation AdminUpdateStudentMembership(
    $userId: String!
    $cohortId: String!
    $sessionId: String!
  ) {
    adminUpdateStudentMembership(
      userId: $userId
      cohortId: $cohortId
      sessionId: $sessionId
    )
  }
`;
const REMOVE_FROM_COHORT = gql`
  mutation AdminRemoveStudentFromCohort($userId: String!, $cohortId: String!) {
    adminRemoveStudentFromCohort(userId: $userId, cohortId: $cohortId)
  }
`;
const ON_STUDENTS_UPDATED = gql`
  subscription OnStudentsUpdated {
    onStudentsUpdated
  }
`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;
const BLANK_CREATE = {
  name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  cohortId: '',
  sessionId: '',
};

function validateCreateForm(f: typeof BLANK_CREATE) {
  const e: Partial<typeof f> = {};
  if (!f.name.trim()) e.name = 'Full name is required.';
  if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';
  if (!PHONE_RE.test(f.phone))
    e.phone = 'Enter a valid phone number (7-15 digits).';
  if (!f.username.trim()) e.username = 'Username is required.';
  if (f.password.length < 6) e.password = 'At least 6 characters.';
  return e;
}

function validateEditForm(f: {
  name: string;
  email: string;
  username: string;
}) {
  const e: Partial<typeof f> = {};
  if (!f.name.trim()) e.name = 'Full name is required.';
  if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';
  if (!f.username.trim()) e.username = 'Username is required.';
  return e;
}

function Field({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  hint,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-mono text-[11px] uppercase tracking-widest text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`w-full h-11 px-3 ${isPassword ? 'pr-10' : ''} bg-[#F9F9F8] border text-[14px] font-sans text-[#0A0A0A] placeholder:text-[#878786]/50 outline-none transition-[border-color] duration-150 focus:border-[#0A0A0A] disabled:opacity-40 rounded-xl ${error ? 'border-[#E54D2E]' : 'border-[#E5E5E4]'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[11px] text-primary uppercase tracking-wide"
        >
          {error}
        </motion.p>
      )}
      {!error && hint && (
        <p className="font-mono text-[10px] text-muted uppercase tracking-wide">
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-mono text-[11px] uppercase tracking-widest text-muted"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-11 px-3 bg-[#F9F9F8] border border-[#E5E5E4] text-[14px] font-sans text-[#0A0A0A] outline-none focus:border-[#0A0A0A] transition-[border-color] duration-150 rounded-none disabled:opacity-40 appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

function ConfirmDeleteModal({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <AlertModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Remove Student"
      description={
        <>
          Permanently delete{' '}
          <strong className="text-secondary font-medium">{name}</strong> and all
          their attendance records. This cannot be undone.
        </>
      }
      confirmText="Remove"
      loading={loading}
    />
  );
}

function CreateStudentModal({
  cohortData,
  onClose,
  onSuccess,
}: {
  cohortData: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [createStudent, { loading }] = useMutation(CREATE_STUDENT);
  const [form, setForm] = useState(BLANK_CREATE);
  const [errors, setErrors] = useState<Partial<typeof BLANK_CREATE>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof typeof BLANK_CREATE, boolean>>
  >({});

  const set = (k: keyof typeof BLANK_CREATE) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: keyof typeof BLANK_CREATE) => () =>
    setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    const e = validateCreateForm(form);
    const visible: Partial<typeof BLANK_CREATE> = {};
    for (const k of Object.keys(touched) as Array<keyof typeof BLANK_CREATE>) {
      if (touched[k]) visible[k] = e[k];
    }
    setErrors(visible);
  }, [form, touched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      Object.keys(BLANK_CREATE).map((k) => [k, true]),
    ) as any;
    setTouched(allTouched);
    const errs = validateCreateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await createStudent({
        variables: {
          ...form,
          cohortId: form.cohortId || undefined,
          sessionId: form.sessionId || undefined,
        },
      });
      toast.success('Student registered successfully.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    }
  };

  const sessions =
    cohortData?.listCohorts?.find((c: any) => c.id === form.cohortId)
      ?.sessions || [];

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalHeader
        title="Register Student"
        subtitle="Students"
        onClose={onClose}
      />
      <ModalBody>
        <form
          id="create-student-form"
          onSubmit={submit}
          noValidate
          className="space-y-8"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4 pb-2 border-b border-border">
              Identity
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                id="c-name"
                label="Full Name"
                placeholder="Abebe Bekele"
                value={form.name}
                onChange={set('name')}
                onBlur={touch('name')}
                error={errors.name}
              />
              <Field
                id="c-email"
                label="Email Address"
                type="email"
                placeholder="abebe@example.com"
                value={form.email}
                onChange={set('email')}
                onBlur={touch('email')}
                error={errors.email}
              />
              <Field
                id="c-phone"
                label="Phone Number"
                type="tel"
                placeholder="+251 9xx xxx xxxx"
                value={form.phone}
                onChange={set('phone')}
                onBlur={touch('phone')}
                error={errors.phone}
                hint="International format preferred"
              />
              <Field
                id="c-username"
                label="Username"
                placeholder="abebe2024"
                value={form.username}
                onChange={set('username')}
                onBlur={touch('username')}
                error={errors.username}
              />
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4 pb-2 border-b border-border">
              Credentials
            </p>
            <Field
              id="c-password"
              label="Temporary Password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              onBlur={touch('password')}
              error={errors.password}
              hint="Student will use this to sign in"
            />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4 pb-2 border-b border-border">
              Cohort Assignment (optional)
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField
                id="c-cohort"
                label="Cohort"
                value={form.cohortId}
                onChange={(v) => {
                  set('cohortId')(v);
                  set('sessionId')('');
                }}
              >
                <option value="">Assign later</option>
                {cohortData?.listCohorts?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="c-session"
                label="Session"
                value={form.sessionId}
                onChange={set('sessionId')}
                disabled={!form.cohortId}
              >
                <option value="">Select session</option>
                {sessions.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="hidden sm:block flex-1 sm:flex-none h-14 px-6 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[13px] uppercase tracking-widest hover:bg-[#F9F9F8] transition-colors rounded-none order-2 sm:order-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="create-student-form"
          disabled={loading}
          className="flex-1 sm:flex-auto h-14 bg-[#0A0A0A] text-white font-mono text-[13px] uppercase tracking-widest hover:bg-[#1C1C1C] disabled:opacity-50 transition-colors rounded-none flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Create Student'
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}

function EditStudentModal({
  student,
  cohortData,
  onClose,
  onRefetch,
}: {
  student: any;
  cohortData: any;
  onClose: () => void;
  onRefetch: () => void;
}) {
  const [updateStudent, { loading: updating }] = useMutation(UPDATE_STUDENT);
  const [enrollStudent] = useMutation(ENROLL_STUDENT);
  const [updateMembership] = useMutation(UPDATE_MEMBERSHIP);
  const [removeMembership] = useMutation(REMOVE_FROM_COHORT);
  const [form, setForm] = useState({
    name: student.name,
    email: student.email,
    username: student.username || '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    username?: string;
  }>({});
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    username: false,
  });
  const [localMemberships, setLocalMemberships] = useState<any[]>(
    student.memberships || [],
  );
  const [newEnrollment, setNewEnrollment] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => {
    const e = validateEditForm(form);
    const visible: { name?: string; email?: string; username?: string } = {};
    if (touched.name) visible.name = e.name;
    if (touched.email) visible.email = e.email;
    if (touched.username) visible.username = e.username;
    setErrors(visible);
  }, [form, touched]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, username: true });
    const errs = validateEditForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await updateStudent({ variables: { id: student.id, ...form } });
      toast.success('Profile updated.');
      onRefetch();
    } catch (err: any) {
      toast.error(err.message || 'Update failed.');
    }
  };

  const handleEnroll = async () => {
    if (!selectedCohort || !selectedSession) return;
    try {
      await enrollStudent({
        variables: {
          userId: student.id,
          cohortId: selectedCohort,
          sessionId: selectedSession,
        },
      });
      const cohort = cohortData?.listCohorts?.find(
        (c: any) => c.id === selectedCohort,
      );
      const sess = cohort?.sessions?.find((s: any) => s.id === selectedSession);
      setLocalMemberships((m) => [
        ...m,
        {
          cohortId: selectedCohort,
          sessionId: selectedSession,
          cohort: { name: cohort?.name },
          session: { name: sess?.name },
        },
      ]);
      toast.success('Enrolled in cohort.');
      setNewEnrollment(false);
      setSelectedCohort('');
      setSelectedSession('');
      onRefetch();
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed.');
    }
  };

  const handleUpdateSession = async (
    cohortId: string,
    newSessionId: string,
  ) => {
    try {
      await updateMembership({
        variables: { userId: student.id, cohortId, sessionId: newSessionId },
      });
      toast.success('Session updated.');
      onRefetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update session.');
    }
  };

  const handleRemoveCohort = async (cohortId: string) => {
    try {
      await removeMembership({ variables: { userId: student.id, cohortId } });
      setLocalMemberships((m) => m.filter((mm) => mm.cohortId !== cohortId));
      toast.success('Removed from cohort.');
      onRefetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove.');
    }
  };

  const enrollSessions =
    cohortData?.listCohorts?.find((c: any) => c.id === selectedCohort)
      ?.sessions || [];

  return (
    <Modal isOpen={true} onClose={onClose} className="sm:max-w-2xl">
      <ModalHeader
        title={student.name}
        subtitle="Manage Student"
        onClose={onClose}
      />
      <ModalBody className="p-0">
        <form
          id="edit-profile-form"
          onSubmit={handleUpdate}
          noValidate
          className="p-6 border-b border-border"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
            Profile
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field
              id="e-name"
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              error={errors.name}
            />
            <Field
              id="e-email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              error={errors.email}
            />
            <div className="sm:col-span-2">
              <Field
                id="e-username"
                label="Username"
                value={form.username}
                onChange={(v) => setForm((f) => ({ ...f, username: v }))}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                error={errors.username}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="h-10 px-6 bg-[#0A0A0A] text-white font-mono text-[11px] uppercase tracking-widest hover:bg-[#1C1C1C] disabled:opacity-50 transition-colors rounded-none flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {updating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Cohort Enrollments
            </p>
            {!newEnrollment && (
              <button
                onClick={() => setNewEnrollment(true)}
                className="h-8 px-3 border border-[#E5E5E4] bg-white text-[#0A0A0A] font-mono text-[10px] uppercase tracking-widest hover:bg-[#F9F9F8] hover:border-[#0A0A0A] transition-colors rounded-none flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> Add Enrollment
              </button>
            )}
          </div>
          <AnimatePresence>
            {newEnrollment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-background border border-border p-4 mb-4 grid sm:grid-cols-2 gap-3">
                  <SelectField
                    id="enroll-cohort"
                    label="Cohort"
                    value={selectedCohort}
                    onChange={(v) => {
                      setSelectedCohort(v);
                      setSelectedSession('');
                    }}
                  >
                    <option value="">Select cohort...</option>
                    {cohortData?.listCohorts?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    id="enroll-session"
                    label="Session"
                    value={selectedSession}
                    onChange={setSelectedSession}
                    disabled={!selectedCohort}
                  >
                    <option value="">Select session...</option>
                    {enrollSessions.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </SelectField>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleEnroll}
                      disabled={!selectedCohort || !selectedSession}
                      className="h-10 px-5 bg-[#0A0A0A] text-white font-mono text-[11px] uppercase tracking-widest disabled:opacity-40 hover:bg-[#1C1C1C] transition-colors rounded-none w-full sm:w-auto justify-center"
                    >
                      Enroll
                    </button>
                    <button
                      onClick={() => {
                        setNewEnrollment(false);
                        setSelectedCohort('');
                        setSelectedSession('');
                      }}
                      className="hidden sm:block h-10 px-4 border border-[#E5E5E4] text-[#878786] font-mono text-[11px] uppercase tracking-widest hover:bg-[#F9F9F8] transition-colors rounded-none w-full sm:w-auto justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {localMemberships.length > 0 ? (
            <div className="divide-y divide-border border border-border">
              {localMemberships.map((m: any) => {
                const cohort = cohortData?.listCohorts?.find(
                  (c: any) => c.id === m.cohortId,
                );
                return (
                  <div
                    key={m.cohortId}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 bg-white hover:bg-background transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[14px] text-secondary">
                        {m.cohort?.name || cohort?.name || 'Unknown Cohort'}
                      </p>
                      <p className="font-mono text-[11px] text-muted uppercase tracking-wide mt-0.5">
                        {m.session?.name || 'Unknown Session'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        className="h-9 px-2 border border-[#E5E5E4] bg-[#F9F9F8] text-[13px] font-sans text-[#0A0A0A] outline-none focus:border-[#0A0A0A] transition-colors rounded-none w-full md:w-36"
                        value={m.sessionId}
                        onChange={(e) =>
                          handleUpdateSession(m.cohortId, e.target.value)
                        }
                      >
                        {cohort?.sessions?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveCohort(m.cohortId)}
                        className="h-9 px-3 border border-[#E54D2E]/30 text-[#E54D2E] font-mono text-[10px] uppercase tracking-widest hover:bg-[#E54D2E]/5 hover:border-[#E54D2E] transition-colors rounded-none flex-1 md:flex-none"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-border">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                Not enrolled in any cohorts
              </p>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

export default function StudentsPage() {
  const { data, loading, refetch } = useQuery<{ listStudents: any[] }>(
    LIST_STUDENTS,
    { fetchPolicy: 'cache-and-network' },
  );
  const { data: cohortData } = useQuery<StudentCohortListData>(LIST_COHORTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [deleteStudent, { loading: deleting }] = useMutation(DELETE_STUDENT);
  useSubscription(ON_STUDENTS_UPDATED, { onData: () => refetch() });

  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  const filteredStudents = (data?.listStudents || []).filter((s: any) =>
    `${s.name} ${s.email} ${s.username || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE),
  );
  const pagedStudents = filteredStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteStudent({ variables: { id: confirmDelete.id } });
      toast.success('Student removed.');
      setConfirmDelete(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove student.');
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl mb-1 text-secondary">Students</h1>
          <p className="font-mono text-[11px] text-muted uppercase tracking-widest">
            Manage enrolled trainees
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-11 px-5 bg-[#0A0A0A] text-white font-mono text-[11px] uppercase tracking-widest hover:bg-[#1C1C1C] transition-colors rounded-none flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register Student
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, username..."
          className="w-full h-11 pl-10 pr-3 border border-[#E5E5E4] bg-[#FFFFFF] text-[14px] font-sans text-[#0A0A0A] placeholder:text-[#878786]/50 outline-none focus:border-[#0A0A0A] transition-colors rounded-none"
        />
      </div>

      <div className="border border-[#E5E5E4] bg-white rounded-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-background">
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11">
                Name and Email
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11">
                Cohorts
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted h-11 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-b border-border">
                  <TableCell className="py-4">
                    <div className="h-4 w-32 bg-background animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-background animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-24 bg-background animate-pulse" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-8 bg-background animate-pulse" />
                      <div className="h-8 w-8 bg-background animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredStudents.length > 0 ? (
              <>
                {pagedStudents.map((student: any) => (
                  <TableRow
                    key={student.id}
                    className="border-b border-border hover:bg-background transition-colors"
                  >
                    <TableCell className="py-4">
                      <div className="font-medium text-[15px] text-secondary">
                        {student.name}
                      </div>
                      <div className="font-mono text-[12px] text-muted mt-0.5">
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.memberships?.length > 0 ? (
                          student.memberships.map((m: any) => (
                            <span
                              key={m.cohortId}
                              className="font-mono text-[10px] uppercase tracking-wide bg-background border border-border px-2 py-1 text-secondary"
                            >
                              {m.cohort?.name || '-'}
                            </span>
                          ))
                        ) : (
                          <span className="font-mono text-[11px] text-muted">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="h-8 w-8 border border-[#E5E5E4] flex items-center justify-center text-[#0A0A0A] hover:bg-[#F9F9F8] hover:border-[#0A0A0A] transition-colors rounded-none"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              id: student.id,
                              name: student.name,
                            })
                          }
                          className="h-8 w-8 border border-[#E54D2E]/20 flex items-center justify-center text-[#E54D2E] hover:bg-[#E54D2E]/5 hover:border-[#E54D2E]/50 transition-colors rounded-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {totalPages > 1 && (
                  <TableRow className="border-t border-border">
                    <TableCell colSpan={3}>
                      <div className="flex items-center justify-between py-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          Page {page} of {totalPages} -{' '}
                          {filteredStudents.length} students
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 w-8 border border-[#E5E5E4] flex items-center justify-center text-[#0A0A0A] hover:bg-[#F9F9F8] disabled:opacity-30 transition-colors rounded-none"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={page === totalPages}
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className="h-8 w-8 border border-[#E5E5E4] flex items-center justify-center text-[#0A0A0A] hover:bg-[#F9F9F8] disabled:opacity-30 transition-colors rounded-none"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-16 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    No students found.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateStudentModal
            key="create"
            cohortData={cohortData}
            onClose={() => setShowCreate(false)}
            onSuccess={() => {
              setShowCreate(false);
              refetch();
            }}
          />
        )}
        {editingStudent && (
          <EditStudentModal
            key="edit"
            student={editingStudent}
            cohortData={cohortData}
            onClose={() => setEditingStudent(null)}
            onRefetch={refetch}
          />
        )}
        {confirmDelete && (
          <ConfirmDeleteModal
            key="confirm"
            name={confirmDelete.name}
            loading={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
