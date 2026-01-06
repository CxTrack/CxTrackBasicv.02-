import React, { useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { Modal, Input, Select, Button } from '../theme/ThemeComponents';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const { inviteMember } = useOrganizationStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter an email address');
            return;
        }

        setLoading(true);
        try {
            await inviteMember(email, role);
            toast.success(`Invitation sent to ${email}`);
            setEmail('');
            setRole('user');
            onClose();
        } catch (error) {
            console.error('Failed to invite member:', error);
            toast.error('Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invite Team Member"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-800/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Invitations will be sent via email. New members will be able to join your organization once they accept the invite.
                    </p>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        required
                        className="w-full"
                    />

                    <Select
                        label="Initial Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        options={[
                            { value: 'user', label: 'User (View & Edit own data)' },
                            { value: 'manager', label: 'Manager (Manage records & view reports)' },
                            { value: 'admin', label: 'Admin (Full access except billing)' },
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Send Invitation
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
