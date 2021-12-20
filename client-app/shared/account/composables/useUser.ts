import { Ref, ref, computed } from "vue";
import { getMe, updatePersonalData } from "@/core/api/graphql/account";
import { UserType, IdentityResultType } from "@core/api/graphql/types";
import { Logger } from "@core/utilities";
import { SignMeUp, SignMeIn } from "@/shared/account";
import useFetch from "@/core/composables/useFetch";
import { setUserId } from "@/core/constants";

const me: Ref<UserType> = ref({
  userName: "",
  phoneNumberConfirmed: false,
  twoFactorEnabled: false,
  securityStamp: "",
  passwordExpired: false,
  id: "",
  accessFailedCount: 0,
  emailConfirmed: false,
  isAdministrator: false,
  lockoutEnabled: false,
});

const loading: Ref<boolean> = ref(false);

export default () => {
  const { innerFetch } = useFetch();

  async function loadMe() {
    loading.value = true;

    try {
      me.value = await getMe();
      setUserId(me.value?.id);
    } catch (e) {
      Logger.error("useUser.loadMe", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(user: UserType): Promise<IdentityResultType> {
    try {
      loading.value = true;
      const personalData = { email: user.email, firstName: user.contact?.firstName, lastName: user.contact?.lastName };
      const result = await updatePersonalData(personalData);
      if (result.succeeded) {
        await loadMe();
      }
      return result;
    } catch (e) {
      Logger.error("useUser.updatePersonalData", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }
  async function changePassword(oldPassword: string, newPassword: string): Promise<IdentityResultType> {
    try {
      loading.value = true;
      const response = await fetch("/storefrontapi/account/password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword, newPasswordConfirm: newPassword }),
      });
      const res = (await response.json()) as IdentityResultType;

      return res;
    } catch (e) {
      Logger.error("useUser.changePassword", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signMeIn(signMeIn: SignMeIn): Promise<IdentityResultType> {
    try {
      loading.value = true;
      const url = "/storefrontapi/account/login";
      const res = await innerFetch<SignMeIn, IdentityResultType>(url, "POST", signMeIn);

      if (res.succeeded) {
        await loadMe();
      }

      return res;
    } catch (e) {
      Logger.error("useUser.signMeIn", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signMeUp(signMeUp: SignMeUp): Promise<IdentityResultType> {
    try {
      loading.value = true;
      const url = "/storefrontapi/account/user";
      const res = await innerFetch<SignMeUp, IdentityResultType>(url, "POST", signMeUp);
      return res;
    } catch (e) {
      Logger.error("useUser.signMeUp", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signMeOut(): Promise<void> {
    try {
      loading.value = true;
      const url = "/storefrontapi/account/logout";

      await innerFetch<null, null>(url, "GET");

      await loadMe();
    } catch (e) {
      Logger.error("useUser.logout", e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    me: computed(() => me.value),
    loading: computed(() => loading.value),
    isAuthenticated: computed(() => me.value && me.value.userName && me.value.userName !== "Anonymous"),
    updateUser,
    changePassword,
    loadMe,
    signMeIn,
    signMeUp,
    signMeOut,
  };
};