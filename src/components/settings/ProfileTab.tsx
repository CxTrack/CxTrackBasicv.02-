/**
 * Profile Tab Component
 * Premium user profile settings with avatar upload and AI CoPilot context
 * Design inspired by Monday.com, GoHighLevel, Linear
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    User, Camera, Upload, X, Check, Briefcase,
    MapPin, Phone, Mail, Linkedin, Globe,
    Calendar, Award, Target, Heart, Coffee,
    Brain, Lightbulb, Sparkles, Save
} from 'lucide-react';
import AvatarEditor from 'react-avatar-editor';
import { DEMO_MODE } from '@/config/demo.config';
import toast from 'react-hot-toast';

interface ProfileData {
    full_name: string;
    email: string;
    phone: string;
    title: string;
    department: string;
    location: string;
    timezone: string;
    bio: string;
    linkedin: string;
    website: string;
    birthday: string;
    avatar_url: string | null;

    // AI Context Fields
    work_style: string[];
    communication_preference: string[];
    goals: string[];
    interests: string[];
    expertise: string[];
    learning_topics: string[];
}

const DEMO_PROFILE_KEY = 'cxtrack_demo_user_profile';

const defaultProfile: ProfileData = {
    full_name: 'Admin User',
    email: 'admin@cxtrack.com',
    phone: '+1 (555) 123-4567',
    title: 'Sales Manager',
    department: 'Sales',
    location: 'New York, NY',
    timezone: 'Eastern Time (ET)',
    bio: 'Experienced sales professional passionate about building relationships and driving growth.',
    linkedin: 'linkedin.com/in/adminuser',
    website: '',
    birthday: '',
    avatar_url: null,
    work_style: ['Early Bird', 'Hybrid'],
    communication_preference: ['Direct', 'Data-Driven'],
    goals: ['Increase sales by 20%', 'Improve customer satisfaction'],
    interests: ['Technology', 'Travel', 'Photography'],
    expertise: ['Sales', 'Marketing'],
    learning_topics: []
};

export const ProfileTab: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData>(defaultProfile);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [scale, setScale] = useState(1.2);
    const [saving, setSaving] = useState(false);
    const editorRef = useRef<AvatarEditor | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load profile from demo storage
    useEffect(() => {
        if (DEMO_MODE) {
            const saved = localStorage.getItem(DEMO_PROFILE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setProfile(parsed);
                if (parsed.avatar_url) {
                    setAvatarPreview(parsed.avatar_url);
                }
            }
        }
    }, []);

    const handleAvatarUpload = async () => {
        if (!editorRef.current) return;

        // Get cropped image as data URL
        const canvas = editorRef.current.getImageScaledToCanvas();
        const dataUrl = canvas.toDataURL('image/png');

        // In demo mode, store as data URL
        if (DEMO_MODE) {
            setAvatarPreview(dataUrl);
            setProfile(prev => ({ ...prev, avatar_url: dataUrl }));
            setShowCropper(false);
            toast.success('Photo updated!');
            return;
        }

        // Production: Upload to Supabase Storage
        // const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as any, 'image/png'));
        // ... Supabase upload logic
    };

    const handleSaveProfile = async () => {
        setSaving(true);

        if (DEMO_MODE) {
            localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
            await new Promise(r => setTimeout(r, 500)); // Simulate save
            toast.success('Profile saved successfully!');
        }

        setSaving(false);
    };

    const toggleArrayItem = (field: keyof ProfileData, item: string) => {
        const current = profile[field] as string[];
        const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
        setProfile({ ...profile, [field]: updated });
    };

    return (
        <div className="space-y-8 max-w-4xl">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Profile Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your personal information and preferences
                </p>
            </div>

            {/* Avatar Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Profile Picture
                </h3>

                <div className="flex items-start gap-8">
                    {/* Current Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                        </div>

                        {/* Camera Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                        >
                            <Camera className="w-5 h-5" />
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setAvatar(URL.createObjectURL(file));
                                    setShowCropper(true);
                                }
                            }}
                            className="hidden"
                        />
                    </div>

                    {/* Upload Instructions */}
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Upload a new photo
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Your photo helps team members recognize you. Recommended size: 400x400px
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Photo
                            </button>
                            {avatarPreview && (
                                <button
                                    onClick={() => {
                                        setAvatarPreview(null);
                                        setProfile(prev => ({ ...prev, avatar_url: null }));
                                    }}
                                    className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Cropper Modal */}
            {showCropper && avatar && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Crop Your Photo
                        </h3>

                        <div className="flex justify-center mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                            <AvatarEditor
                                ref={editorRef}
                                image={avatar}
                                width={250}
                                height={250}
                                border={30}
                                borderRadius={125}
                                color={[0, 0, 0, 0.6]}
                                scale={scale}
                                rotate={0}
                            />
                        </div>

                        {/* Scale Slider */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Zoom
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAvatarUpload}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <Check className="w-5 h-5" />
                                Save Photo
                            </button>
                            <button
                                onClick={() => setShowCropper(false)}
                                className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="john@example.com"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Title
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={profile.title}
                                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                placeholder="Sales Manager"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Department
                        </label>
                        <input
                            type="text"
                            value={profile.department}
                            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                            placeholder="Sales"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                placeholder="New York, NY"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Timezone
                        </label>
                        <select
                            value={profile.timezone}
                            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                            <option>Eastern Time (ET)</option>
                            <option>Central Time (CT)</option>
                            <option>Mountain Time (MT)</option>
                            <option>Pacific Time (PT)</option>
                            <option>Alaska Time (AKT)</option>
                            <option>Hawaii Time (HT)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Birthday
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={profile.birthday}
                                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                    </label>
                    <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 500) })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        {profile.bio.length}/500 characters
                    </p>
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Social Links
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            LinkedIn
                        </label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="url"
                                value={profile.linkedin}
                                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                placeholder="linkedin.com/in/johndoe"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Website
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="url"
                                value={profile.website}
                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                placeholder="johndoe.com"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI CoPilot Context */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            AI CoPilot Context
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Help your AI assistant understand you better
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Work Style */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Coffee className="w-4 h-4 inline mr-2" />
                            Work Style
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Early Bird', 'Night Owl', 'Flexible', 'Remote', 'In-Office', 'Hybrid'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleArrayItem('work_style', style)}
                                    className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${profile.work_style.includes(style)
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                        }
                  `}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Communication Preference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Lightbulb className="w-4 h-4 inline mr-2" />
                            Communication Style
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Direct', 'Detailed', 'Visual', 'Data-Driven', 'Collaborative', 'Async'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleArrayItem('communication_preference', style)}
                                    className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${profile.communication_preference.includes(style)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }
                  `}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goals */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Target className="w-4 h-4 inline mr-2" />
                            Current Goals
                        </label>
                        <textarea
                            value={profile.goals.join('\n')}
                            onChange={(e) => setProfile({ ...profile, goals: e.target.value.split('\n').filter(g => g.trim()) })}
                            placeholder="- Increase sales by 20%&#10;- Learn React&#10;- Improve customer satisfaction"
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>

                    {/* Expertise */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Award className="w-4 h-4 inline mr-2" />
                            Areas of Expertise
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Sales', 'Marketing', 'Product', 'Engineering', 'Design', 'Operations', 'Finance', 'HR', 'Customer Success'].map(area => (
                                <button
                                    key={area}
                                    onClick={() => toggleArrayItem('expertise', area)}
                                    className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${profile.expertise.includes(area)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400'
                                        }
                  `}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Heart className="w-4 h-4 inline mr-2" />
                            Interests & Hobbies
                        </label>
                        <input
                            type="text"
                            value={profile.interests.join(', ')}
                            onChange={(e) => setProfile({ ...profile, interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean) })}
                            placeholder="Travel, Photography, Cooking, Tech"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>
                </div>

                {/* AI Context Info */}
                <div className="mt-6 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <Sparkles className="w-4 h-4 inline mr-2 text-purple-600" />
                        This information helps your AI CoPilot provide more personalized assistance, suggest relevant content, and understand your work style better.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pb-8">
                <button
                    onClick={() => setProfile(defaultProfile)}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProfileTab;
