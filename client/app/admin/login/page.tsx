"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginModal } from "@/components/admin-login-modal";

export default function AdminLoginPage() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (token) {
      router.push('/admin');
    } else {
      setShowModal(true);
    }
  }, [router]);

  const handleModalClose = () => {
    setShowModal(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminLoginModal open={showModal} onOpenChange={handleModalClose} />
    </div>
  );
}

