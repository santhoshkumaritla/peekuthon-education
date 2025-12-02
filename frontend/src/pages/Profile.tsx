import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Users, Save, Edit2, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentName: user?.studentName || '',
    studentMobile: user?.studentMobile || '',
    parentMobile: user?.parentMobile || '',
  });

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      studentName: user?.studentName || '',
      studentMobile: user?.studentMobile || '',
      parentMobile: user?.parentMobile || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user?._id) return;

    // Validation
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return;
    }
    if (!formData.studentMobile.trim() || formData.studentMobile.length !== 10) {
      setError('Valid 10-digit student mobile number is required');
      return;
    }
    if (!formData.parentMobile.trim() || formData.parentMobile.length !== 10) {
      setError('Valid 10-digit parent mobile number is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user in context and localStorage
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} variant="outline">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your basic account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Name */}
          <div className="space-y-2">
            <Label htmlFor="studentName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Name
            </Label>
            {isEditing ? (
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => handleChange('studentName', e.target.value)}
                placeholder="Enter student name"
                disabled={loading}
              />
            ) : (
              <div className="px-3 py-2 bg-muted rounded-md">
                {user.studentName}
              </div>
            )}
          </div>

          {/* Student Mobile */}
          <div className="space-y-2">
            <Label htmlFor="studentMobile" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Student Mobile Number
            </Label>
            {isEditing ? (
              <Input
                id="studentMobile"
                type="tel"
                value={formData.studentMobile}
                onChange={(e) => handleChange('studentMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
                disabled={loading}
              />
            ) : (
              <div className="px-3 py-2 bg-muted rounded-md">
                {user.studentMobile}
              </div>
            )}
          </div>

          {/* Parent Mobile */}
          <div className="space-y-2">
            <Label htmlFor="parentMobile" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parent Mobile Number
            </Label>
            {isEditing ? (
              <Input
                id="parentMobile"
                type="tel"
                value={formData.parentMobile}
                onChange={(e) => handleChange('parentMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
                disabled={loading}
              />
            ) : (
              <div className="px-3 py-2 bg-muted rounded-md">
                {user.parentMobile}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              SMS notifications will be sent to this number
            </p>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
            <span className="text-sm text-muted-foreground">
              Your account is active and in good standing
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
