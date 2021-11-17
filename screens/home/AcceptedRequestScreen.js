import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import API from "../../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RequestUser from "./subcomponent/RequestUser";

// icons
import { MaterialIcons } from "@expo/vector-icons";

// screen dimension
const winHeight = Dimensions.get("screen").height;

// refresh wait
const wait = (timeout) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

export default function AcceptedRequestScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [reqData, setReqData] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [requestorId, setRequestorId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  //   single request
  const [requestId, setRequesId] = useState(null);
  const [oneReq, setOneReq] = useState(null);
  //   loading
  const [isLoading, setIsLoading] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    wait(2000).then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    getStoreId();
  }, []);

  useEffect(() => {
    if (storeId !== null) {
      fetchRequest();
    }
  }, [storeId, refreshing, openModal]);

  useEffect(() => {
    if (requestorId !== null && requestId !== null) {
      getRequestorData();
      fetchSingleRequestData();
    }
  }, [requestorId, requestId]);

  const fetchRequest = async () => {
    try {
      const res = await API.get(
        `/api/service/request/store/${storeId}`
      );
      if (res.data) {
        setReqData(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getStoreId = async () => {
    try {
      const res = await AsyncStorage.getItem("findLoginCredential");
      if (res) {
        const parsedData = JSON.parse(res);
        setStoreId(parsedData.userID);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSingleRequestData = async () => {
    try {
      const res = await API.get(
        `/api/service/request/${requestId}`
      );
      if (res.data) {
        setOneReq(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getRequestorData = async () => {
    try {
      const res = await API.get(
        `/api/driver/${requestorId}`
      );
      if (res.data) {
        setUserData(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //   mark as finish the service
  const finishedRequest = async () => {
    try {
      if (requestId) {
        const res = await API.patch(`/api/service/cancel/${requestId}`, {
          transactionStatus: "finished",
        });
        console.log(res.data);
        setIsLoading(false);
        setOpenModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //   ask for confirmation to cancel request
  const finishedAlert = () => {
    Alert.alert("Confirmation!", "Mark the request as finished?", [
      {
        text: "Cancel",
        onPress: () => setIsLoading(false),
        style: "cancel",
      },
      {
        text: "YES",
        onPress: () => {
          finishedRequest();
        },
      },
    ]);
    return true;
  };
  return (
    <View
      style={{
        flex: 1,
        marginTop: 5,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reqData?.length > 0 ? (
          <>
            {reqData
              ?.filter((m) => m.transactionStatus === "accepted")
              .map((data, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setOpenModal(true);
                      setRequestorId(data.transactionMember[0]);
                      setRequesId(data._id);
                    }}
                  >
                    <RequestUser
                      reqData={reqData}
                      storeId={storeId}
                      driverId={data.transactionMember[0]}
                    />
                  </TouchableOpacity>
                );
              })}
          </>
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text>No request at the moment</Text>
          </View>
        )}
      </ScrollView>
      <Modal animationType="slide" transparent={true} visible={openModal}>
        <View style={styles.modalMainContainer}>
          <View style={styles.topModal}>
            <TouchableOpacity
              onPress={() => {
                setOpenModal(false);
              }}
            >
              <MaterialIcons name="close" size={24} color="#0073e6" />
            </TouchableOpacity>
            <Text style={styles.topHeaderText}>Request Data</Text>
          </View>
          <Text style={styles.title}>Requestor</Text>
          <View style={styles.driverDataContainer}>
            <Text>
              {userData?.firstname} {userData?.middlename} {userData?.lastname}
            </Text>
          </View>
          <Text style={styles.title}>Problem Message</Text>
          <View style={styles.messageContainer}>
            <Text>{oneReq?.statementMessage}</Text>
          </View>
          <Text style={styles.title}>Requested Services</Text>
          {oneReq?.selectedServices.map((data, index) => (
            <View style={styles.requestedService} key={index}>
              <MaterialIcons
                name="home-repair-service"
                size={24}
                color="#999999"
              />
              <Text style={{ marginLeft: 5 }}>{data}</Text>
            </View>
          ))}
          <Text style={styles.title}>Attached Images</Text>
          <View style={styles.conImg}>
            <ScrollView
              showsHorizontalScrollIndicator={false}
              horizontal={true}
            >
              {oneReq?.attachedImages.map((data, index) => (
                <View style={styles.imgBox} key={index}>
                  <Image
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                    source={{ uri: data }}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
          <Text style={styles.title}>Status</Text>
          <View style={styles.statusContainer}>
            <MaterialIcons name="check-circle" size={24} color="#00cc66" />
            <Text style={{ marginLeft: 5 }}>Accepted</Text>
          </View>
          <TouchableOpacity
            style={styles.btnFinish}
            onPress={() => {
              finishedAlert();
              setIsLoading(true);
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text
                style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}
              >
                Marked as Finished
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalMainContainer: {
    backgroundColor: "#ffffff",
    width: "100%",
    height: winHeight,
    padding: 10,
  },
  topModal: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  topHeaderText: {
    fontWeight: "700",
    textTransform: "uppercase",
    marginLeft: 10,
  },
  driverDataContainer: {
    width: "100%",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0073e6",
    marginVertical: 10,
  },
  messageContainer: {
    width: "100%",
    backgroundColor: "#e6e6e6",
    padding: 10,
    borderRadius: 5,
  },
  requestedService: {
    width: "100%",
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  conImg: {
    width: "100%",
    padding: 10,
    backgroundColor: "#e6e6e6",
  },
  imgBox: {
    height: 80,
    width: 80,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    marginRight: 10,
    overflow: "hidden",
  },
  statusContainer: {
    width: "100%",
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  btnFinish: {
    width: "90%",
    alignSelf: "center",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0073e6",
    marginTop: 50,
  },
});
