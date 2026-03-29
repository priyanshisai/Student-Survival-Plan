import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { createBlog } from "@/features/profile/services/profile";

export default function WriteBlogScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createBlog(title.trim(), content.trim(), true);
      router.back();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Failed to publish blog");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Write Blog" subtitle="Share campus tips, stories, and guides with other students.">
      <AppCard>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Field label="Title" onChangeText={setTitle} placeholder="Best study spots on campus" value={title} />
        <Field
          label="Content"
          multiline
          onChangeText={setContent}
          placeholder="Write your post..."
          value={content}
        />
        <PrimaryButton label={saving ? "Publishing..." : "Publish blog"} onPress={handlePublish} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    fontWeight: "600",
  },
});
