import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { createStudyGroup } from "@/features/community/services/community";

export default function CreateGroupScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createStudyGroup(name.trim(), description.trim() || undefined);
      router.back();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create group");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Create Group" subtitle="Open a new study group and start inviting people.">
      <AppCard>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Field label="Group name" onChangeText={setName} placeholder="DSA Warriors" value={name} />
        <Field
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="What is this group for?"
          value={description}
        />
        <PrimaryButton label={saving ? "Creating..." : "Create group"} onPress={handleCreate} />
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
