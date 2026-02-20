import React, { useState } from "react";
import { siteConfig } from "@/site.config";
import { submitInquiry } from "@/lib/firestore";
import { Mail, Phone, MessageCircle, Send, CheckCircle } from "lucide-react";

export const ContactSection: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("이름, 이메일, 문의 내용은 필수입니다.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await submitInquiry(form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      setError("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{
              background: siteConfig.colors.primary50,
              color: siteConfig.colors.primary700,
            }}
          >
            문의하기
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            궁금한 점이 있으신가요?
          </h2>
          <p className="text-gray-500">
            언제든지 편하게 문의해 주세요. 빠르게 답변드리겠습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">연락처 정보</h3>

            {siteConfig.contact.email && (
              <ContactItem
                icon={<Mail size={20} />}
                label="이메일"
                value={siteConfig.contact.email}
                href={`mailto:${siteConfig.contact.email}`}
                colors={siteConfig.colors}
              />
            )}
            {siteConfig.contact.phone && (
              <ContactItem
                icon={<Phone size={20} />}
                label="전화"
                value={siteConfig.contact.phone}
                href={`tel:${siteConfig.contact.phone}`}
                colors={siteConfig.colors}
              />
            )}
            {siteConfig.contact.kakao && (
              <ContactItem
                icon={<MessageCircle size={20} />}
                label="카카오채널"
                value={siteConfig.contact.kakao}
                href={`https://pf.kakao.com/_${siteConfig.contact.kakao}`}
                colors={siteConfig.colors}
              />
            )}
            {siteConfig.contact.telegram && (
              <ContactItem
                icon={<Send size={20} />}
                label="텔레그램"
                value={siteConfig.contact.telegram}
                href={`https://t.me/${siteConfig.contact.telegram}`}
                colors={siteConfig.colors}
              />
            )}

            {/* Social Links */}
            {siteConfig.social && (
              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-3">소셜 미디어</p>
                <div className="flex gap-3">
                  {siteConfig.social.twitter && (
                    <SocialBtn
                      href={siteConfig.social.twitter}
                      label="Twitter/X"
                      colors={siteConfig.colors}
                    />
                  )}
                  {siteConfig.social.instagram && (
                    <SocialBtn
                      href={siteConfig.social.instagram}
                      label="Instagram"
                      colors={siteConfig.colors}
                    />
                  )}
                  {siteConfig.social.youtube && (
                    <SocialBtn
                      href={siteConfig.social.youtube}
                      label="YouTube"
                      colors={siteConfig.colors}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: siteConfig.colors.primary500 }}
                />
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  문의가 접수되었습니다!
                </h4>
                <p className="text-gray-500 mb-6">
                  빠른 시간 내에 답변 드리겠습니다.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background: siteConfig.colors.primary600 }}
                >
                  다시 문의하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="홍길동"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
                      style={
                        {
                          "--tw-ring-color": siteConfig.colors.primary500,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      연락처
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    문의 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    rows={5}
                    placeholder="문의하실 내용을 자유롭게 작성해 주세요."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 transition-shadow resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: siteConfig.colors.primary600 }}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      문의 보내기
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Sub components
interface ContactItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  colors: { primary50: string; primary600: string };
}

const ContactItem: React.FC<ContactItemProps> = ({
  icon,
  label,
  value,
  href,
  colors,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all group"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
      style={{ background: colors.primary50, color: colors.primary600 }}
    >
      {icon}
    </div>
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium text-gray-800">{value}</div>
    </div>
  </a>
);

const SocialBtn: React.FC<{
  href: string;
  label: string;
  colors: { primary50: string; primary600: string };
}> = ({ href, label, colors }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:shadow-sm transition-all"
    style={{ background: colors.primary50, color: colors.primary600 }}
  >
    {label}
  </a>
);
