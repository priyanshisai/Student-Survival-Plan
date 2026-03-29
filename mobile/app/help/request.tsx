import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { createHelpRequest, type HelpType } from "@/features/help/services/help";

export default function HelpRequestScreen() {
  const params = useLocalSearchParams<{ type?: HelpType }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!params.type || !title.trim()) {
      setError("Type and title are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createHelpRequest(params.type, title.trim(), description.trim() || undefined);
      router.back();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Create Help Request" subtitle="Send the request directly to the community feed.">
      <AppCard>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Field label="Type" onChangeText={() => undefined} value={params.type ?? "item"} />
        <Field label="Title" onChangeText={setTitle} placeholder="What do you need?" value={title} />
        <Field
          label="Description"
          multiline
          onChangeText={setDescription}
          placeholder="Add context so others can help faster."
          value={description}
        />
        <PrimaryButton label={saving ? "Submitting..." : "Submit request"} onPress={handleSubmit} />
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
