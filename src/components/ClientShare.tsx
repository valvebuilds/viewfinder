'use client'

import { useState } from 'react'
import { useAlbumStore } from '@/store/useAlbumStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare, 
  Heart, 
  Download,
  Eye,
  Settings,
  Users,
  Clock,
  Link,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import toast from 'react-hot-toast'

export function ClientShare() {
  const { currentAlbum } = useAlbumStore()
  const [activeTab, setActiveTab] = useState<'share' | 'feedback' | 'analytics'>('share')
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'qr'>('link')
  const [clientEmail, setClientEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [permissions, setPermissions] = useState({
    canView: true,
    canDownload: true,
    canComment: true,
    canSelect: false
  })

  if (!currentAlbum) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Share2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Album to Share</h3>
        <p className="text-gray-600">Generate an album first to share with clients</p>
      </div>
    )
  }

  const generateShareLink = async () => {
    setIsGeneratingLink(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    const link = `https://viewfinder.app/album/${currentAlbum.id}?token=${Math.random().toString(36).substr(2, 9)}`
    setShareLink(link)
    setIsGeneratingLink(false)
    toast.success('Share link generated!')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const sendEmail = async () => {
    if (!clientEmail) {
      toast.error('Please enter a client email')
      return
    }
    
    toast.success(`Album shared with ${clientEmail}`)
    setClientEmail('')
  }

  const mockFeedback = [
    {
      id: '1',
      photoId: 'photo-1',
      type: 'like' as const,
      content: 'Love this shot!',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      clientInfo: { name: 'Sarah Johnson', email: 'sarah@example.com' }
    },
    {
      id: '2',
      photoId: 'photo-3',
      type: 'comment' as const,
      content: 'Could we get a version without the background person?',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      clientInfo: { name: 'Sarah Johnson', email: 'sarah@example.com' }
    },
    {
      id: '3',
      photoId: 'photo-5',
      type: 'selection' as const,
      content: 'This is perfect for our website!',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      clientInfo: { name: 'Sarah Johnson', email: 'sarah@example.com' }
    }
  ]

  const mockAnalytics = {
    totalViews: 24,
    uniqueViewers: 3,
    averageTimeSpent: '4m 32s',
    mostViewedPhoto: 'photo-2',
    feedbackCount: mockFeedback.length,
    downloadCount: 8
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Album</h2>
            <p className="text-sm text-gray-600">
              {currentAlbum.name} • {currentAlbum.photos.length} photos
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'share', label: 'Share', icon: Share2 },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'text-primary-600 border-b-2 border-primary-600' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-6">
          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Share Method */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Share Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'link', label: 'Share Link', icon: Link, description: 'Generate a secure link to share' },
                    { id: 'email', label: 'Email Invite', icon: Mail, description: 'Send directly to client email' },
                    { id: 'qr', label: 'QR Code', icon: QrCode, description: 'Generate QR code for easy access' }
                  ].map((method) => {
                    const Icon = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => setShareMethod(method.id as any)}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all duration-200
                          ${shareMethod === method.id 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="w-5 h-5 text-primary-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">{method.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{method.description}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Share Link */}
              {shareMethod === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Share Link
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        placeholder="Click generate to create share link"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={generateShareLink}
                        disabled={isGeneratingLink}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                      >
                        {isGeneratingLink ? 'Generating...' : 'Generate'}
                      </button>
                      {shareLink && (
                        <button
                          onClick={() => copyToClipboard(shareLink)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Invite */}
              {shareMethod === 'email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder="Hi! I've created a beautiful album for you to review..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <button
                    onClick={sendEmail}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Invite</span>
                  </button>
                </div>
              )}

              {/* QR Code */}
              {shareMethod === 'qr' && (
                <div className="text-center space-y-4">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    QR code will be generated when you create a share link
                  </p>
                </div>
              )}

              {/* Permissions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Client Permissions</h3>
                <div className="space-y-3">
                  {[
                    { key: 'canView', label: 'Can view photos', description: 'Client can browse the album' },
                    { key: 'canDownload', label: 'Can download photos', description: 'Client can download individual photos' },
                    { key: 'canComment', label: 'Can leave feedback', description: 'Client can comment and provide feedback' },
                    { key: 'canSelect', label: 'Can select favorites', description: 'Client can mark photos as favorites' }
                  ].map((permission) => (
                    <label key={permission.key} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={permissions[permission.key as keyof typeof permissions]}
                        onChange={(e) => setPermissions(prev => ({
                          ...prev,
                          [permission.key]: e.target.checked
                        }))}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{permission.label}</div>
                        <div className="text-sm text-gray-600">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Client Feedback</h3>
                <span className="text-sm text-gray-600">{mockFeedback.length} comments</span>
              </div>

              <div className="space-y-4">
                {mockFeedback.map((feedback) => (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {feedback.type === 'like' && <Heart className="w-4 h-4 text-primary-600" />}
                        {feedback.type === 'comment' && <MessageSquare className="w-4 h-4 text-primary-600" />}
                        {feedback.type === 'selection' && <Star className="w-4 h-4 text-primary-600" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {feedback.clientInfo.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {feedback.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{feedback.content}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Photo {feedback.photoId}</span>
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Album Analytics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Views</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{mockAnalytics.totalViews}</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Unique Viewers</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{mockAnalytics.uniqueViewers}</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Avg. Time</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{mockAnalytics.averageTimeSpent}</div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Feedback</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{mockAnalytics.feedbackCount}</div>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Download className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Downloads</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">{mockAnalytics.downloadCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
