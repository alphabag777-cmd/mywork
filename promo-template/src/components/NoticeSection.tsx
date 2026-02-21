import React, { useEffect, useState } from "react";
import { fetchNotices, type Notice } from "@/lib/firestore";
import { siteConfig } from "@/site.config";
import { Bell, ChevronRight, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const NoticeSection: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchNotices(8)
      .then(setNotices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="notice" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{
              background: siteConfig.colors.primary50,
              color: siteConfig.colors.primary700,
            }}
          >
            공지사항
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            최신 공지사항
          </h2>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-40" />
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {notices.map((notice) => (
              <div key={notice.id}>
                <button
                  onClick={() =>
                    setExpanded(expanded === notice.id ? null : notice.id!)
                  }
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  {notice.important && (
                    <AlertTriangle
                      size={16}
                      className="flex-shrink-0"
                      style={{ color: "#ef4444" }}
                    />
                  )}
                  <span className="flex-1 font-medium text-gray-800 line-clamp-1">
                    {notice.title}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {notice.createdAt ? formatDate(notice.createdAt) : ""}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${
                      expanded === notice.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expanded === notice.id && (
                  <div className="px-5 pb-5 pt-2 bg-gray-50 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
