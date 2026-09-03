'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useSubscription,
} from '@apollo/client/react/index.js';
import { gql } from '@apollo/client/core/index.js';
import { Loader2, ArrowRight, X, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';

const MY_COHORTS = gql`
  query MyCohorts {
    myCohorts {
      id
      name
      startDate
      endDate
      isActive
      joinedSession {
        id
        name
      }
    }
  }
`;

const AVAILABLE_COHORTS = gql`
  query AvailableCohorts {
    availableCohorts {
      id
      name
      startDate
      endDate
      isActive
      sessions {
        id
        name
        startTime
      }
    }
  }
`;

const JOIN_COHORT = gql`
  mutation JoinCohort($cohortId: String!, $sessionId: String!, $pin: String!) {
    joinCohort(cohortId: $cohortId, sessionId: $sessionId, pin: $pin)
  }
`;

const ON_COHORTS_UPDATED = gql`
  subscription OnCohortsUpdated {
    onCohortsUpdated
  }
`;

export default function StudentCohortsPage() {
  const {
    data: myCohortsData,
    loading: myCohortsLoading,
    refetch: refetchMyCohorts,
  } = useQuery<{ myCohorts: any[] }>(MY_COHORTS, {
    fetchPolicy: 'cache-and-network',
  });
  const {
    data: availableCohortsData,
    loading: availableCohortsLoading,
    refetch: refetchAvailableCohorts,
  } = useQuery<{ availableCohorts: any[] }>(AVAILABLE_COHORTS, {
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(ON_COHORTS_UPDATED, {
    onData: () => {
      refetchMyCohorts();
      refetchAvailableCohorts();
    },
  });

  const [joinCohort, { loading: joining }] = useMutation(JOIN_COHORT);

  const [joiningCohort, setJoiningCohort] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [pin, setPin] = useState('');

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningCohort || !selectedSessionId) {
      toast.error('Please select a session.');
      return;
    }

    try {
      await joinCohort({
        variables: {
          cohortId: joiningCohort.id,
          sessionId: selectedSessionId,
          pin,
        },
      });
      toast.success(`Successfully joined ${joiningCohort.name}!`);
      setJoiningCohort(null);
      setSelectedSessionId('');
      setPin('');
      refetchMyCohorts();
      refetchAvailableCohorts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to join cohort. Check your PIN.');
    }
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 bg-background min-h-full font-sans text-foreground">
      {/* Header Area */}
      <div>
        <h2 className="font-serif text-3xl mb-1 text-foreground">Your Classes</h2>
        <p className="text-[13px] text-muted">
          Manage your enrollments and discover new cohorts.
        </p>
      </div>

      {/* My Cohorts */}
      <section className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted px-1 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Enrolled Cohorts
        </h3>
        <div className="bg-surface border border-border rounded-none shadow-sm">
          {myCohortsLoading && !myCohortsData?.myCohorts ? (
            <div className="divide-y divide-border">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-surface-subtle animate-pulse" />
                    <div className="h-4 w-24 bg-surface-subtle animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-surface-subtle animate-pulse" />
                </div>
              ))}
            </div>
          ) : (myCohortsData?.myCohorts?.length ?? 0) > 0 ? (
            <ul className="divide-y divide-border">
              {myCohortsData?.myCohorts?.map((cohort: any) => (
                <li
                  key={cohort.id}
                  className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-[15px] text-foreground">{cohort.name}</h4>
                    <p className="text-[13px] text-muted mt-0.5">
                      {cohort.joinedSession
                        ? `Session: ${cohort.joinedSession.name}`
                        : `Started: ${new Date(cohort.startDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-success-surface text-success px-2 py-1 rounded-full border border-success/20">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-muted" />
              </div>
              <p className="text-[14px] text-muted">
                Not enrolled in any cohorts.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Available Cohorts */}
      <section className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted px-1 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Available to Join
        </h3>
        <div className="bg-surface border border-border rounded-none shadow-sm">
          {availableCohortsLoading &&
          !availableCohortsData?.availableCohorts ? (
            <div className="divide-y divide-border">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-surface-subtle animate-pulse" />
                    <div className="h-4 w-24 bg-surface-subtle animate-pulse" />
                  </div>
                  <div className="h-8 w-16 bg-surface-subtle animate-pulse" />
                </div>
              ))}
            </div>
          ) : (availableCohortsData?.availableCohorts?.length ?? 0) > 0 ? (
            <ul className="divide-y divide-border">
              {availableCohortsData?.availableCohorts?.map((cohort: any) => (
                <li
                  key={cohort.id}
                  className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors group"
                >
                  <div>
                    <h4 className="font-medium text-[15px] text-foreground">{cohort.name}</h4>
                    <p className="text-[13px] text-muted mt-0.5">
                      {cohort.sessions?.length || 0} Sessions Available
                    </p>
                  </div>
                  <button
                    onClick={() => setJoiningCohort(cohort)}
                    className="h-8 px-4 rounded-none bg-primary text-primary-foreground text-[11px] font-mono uppercase tracking-widest hover:bg-primary-hover flex items-center gap-1 active:scale-95 transition-all"
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-muted text-[14px]">
              No new cohorts available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* Join Cohort Modal */}
      <Modal
        isOpen={!!joiningCohort}
        onClose={() => setJoiningCohort(null)}
        className="sm:max-w-md"
      >
        <ModalHeader
          title="Join Cohort"
          subtitle={joiningCohort?.name}
          onClose={() => setJoiningCohort(null)}
        />
        <ModalBody>
          <div className="mb-6">
            <p className="text-[14px] text-muted leading-relaxed">
              You are about to join{' '}
              <strong className="text-foreground">{joiningCohort?.name}</strong>.
              Please select a session and enter the secure PIN.
            </p>
          </div>

          <form
            id="join-cohort-form"
            onSubmit={handleJoinSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-widest text-muted">
                Select Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                required
                className="w-full h-11 px-3 border border-border bg-surface-subtle text-foreground text-[14px] focus:border-foreground outline-none transition-colors rounded-none"
              >
                <option value="" disabled>
                  Choose a session...
                </option>
                {joiningCohort?.sessions?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-widest text-muted">
                Secure PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                placeholder="Enter PIN"
                className="w-full h-11 px-3 border border-border bg-surface-subtle text-foreground text-[14px] focus:border-foreground outline-none transition-colors rounded-none text-center tracking-widest"
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setJoiningCohort(null)}
            className="hidden sm:flex flex-1 sm:flex-none min-h-[56px] shrink-0 px-6 border border-border bg-surface text-foreground font-mono text-[13px] uppercase tracking-widest hover:bg-surface-hover transition-colors rounded-none order-2 sm:order-1 items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="join-cohort-form"
            disabled={joining || !pin}
            className="flex-1 sm:flex-auto min-h-[56px] shrink-0 py-3 px-6 bg-primary text-primary-foreground font-mono text-[13px] uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-colors rounded-none flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {joining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Verify & Join'
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
